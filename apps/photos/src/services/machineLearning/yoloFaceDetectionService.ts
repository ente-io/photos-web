import * as tf from '@tensorflow/tfjs-core';
import { GraphModel } from '@tensorflow/tfjs-converter';
import {
    FaceDetection,
    FaceDetectionMethod,
    FaceDetectionService,
    Versioned,
} from 'types/machineLearning';
import { Box, Point } from '../../../thirdparty/face-api/classes';
import { resizeToSquare } from 'utils/image';
import {
    computeTransformToBox,
    transformBox,
    transformPoints,
} from 'utils/machineLearning/transform';
import {  newBox } from 'utils/machineLearning';
import {
    removeDuplicateDetections,
} from 'utils/machineLearning/faceDetection';
import {
    BLAZEFACE_FACE_SIZE,
    MAX_FACE_DISTANCE_PERCENT,
} from 'constants/mlConfig';

import * as ort from 'onnxruntime-web';
import { env } from 'onnxruntime-web';

env.wasm.wasmPaths = '/js/onnx/';
class YoloFaceDetectionService implements FaceDetectionService {
    private onnxInferenceSession?: ort.InferenceSession;
    private blazeFaceBackModel: GraphModel;
    public method: Versioned<FaceDetectionMethod>;
    private desiredFaceSize;


    public constructor(desiredFaceSize: number = BLAZEFACE_FACE_SIZE) {
        this.method = {
            value: 'YoloFace',
            version: 1,
        };
        this.desiredFaceSize = desiredFaceSize;
    }

    private async initOnnx() {
        console.log("start ort");
        this.onnxInferenceSession = await ort.InferenceSession.create('/models/yolo/yolov5s_face_640_640_dynamic.onnx');
        var data = new Float32Array(1 * 3 * 640 * 640);
        var inputTensor = new ort.Tensor('float32', data, [1, 3, 640, 640]);
        const feeds: Record<string, ort.Tensor> = {};
        let name = this.onnxInferenceSession.inputNames[0];
        feeds[name] = inputTensor;
        var runout = await this.onnxInferenceSession.run(feeds);
    }

    public async detectFacesUsingModel(image: tf.Tensor3D) {
        const resizedImage = tf.image.resizeBilinear(image, [256, 256]);
        const reshapedImage = tf.reshape(resizedImage, [
            1,
            resizedImage.shape[0],
            resizedImage.shape[1],
            3,
        ]);
        const normalizedImage = tf.sub(tf.div(reshapedImage, 127.5), 1.0);
        const results = await this.blazeFaceBackModel.predict(normalizedImage);
        return results;
    }


    private async getOnnxInferenceSession() {
        if (!this.onnxInferenceSession) {
            await this.initOnnx();
        }
        return this.onnxInferenceSession;
    }

    private imageBitmapToTensorData(imageBitmap) {
        // Create an OffscreenCanvas and set its size
        const offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = offscreenCanvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height);
        const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
        const pixelData = imageData.data;
        const data = new Float32Array(1 * 3 * imageBitmap.width * imageBitmap.height);
        // Populate the Float32Array with normalized pixel values
        for (let i = 0; i < pixelData.length; i += 4) {
          // Normalize pixel values to the range [0, 1]
          data[i / 4] = pixelData[i] / 255.0;         // Red channel
          data[i / 4 + imageBitmap.width * imageBitmap.height] = pixelData[i + 1] / 255.0; // Green channel
          data[i / 4 + 2 * imageBitmap.width * imageBitmap.height] = pixelData[i + 2] / 255.0; // Blue channel
        }
      
        return {
          data: data,
          shape: [1, 3, imageBitmap.width, imageBitmap.height]
        };
      }
      
         // The rowOutput is a Float32Array of shape [25200, 16], where each row represents a bounding box.
    private getFacesFromYoloOutput(rowOutput : Float32Array, minScore: number,): Array<FaceDetection> {
        const faces: Array<FaceDetection> = [];
        // iterate over each row
        for (let i = 0; i < rowOutput.length; i += 16) {
            const score = rowOutput[i + 4];
          if (score < minScore) {
            continue;
          }
          // The first 4 values represent the bounding box's coordinates (x1, y1, x2, y2)
          const xCenter = rowOutput[i];
          const yCenter = rowOutput[i + 1];
          const width = rowOutput[i + 2];
          const height = rowOutput[i + 3];
          const xMin = xCenter - width / 2.0; // topLeft
          const yMin = yCenter - height / 2.0; // topLeft
          
          const leftEyeX = rowOutput[i + 5];
          const leftEyeY = rowOutput[i + 6];
          const rightEyeX = rowOutput[i + 7];
          const rightEyeY = rowOutput[i + 8];
          const noseX = rowOutput[i + 9];
          const noseY = rowOutput[i + 10];
          const leftMouthX = rowOutput[i + 11];
          const leftMouthY = rowOutput[i + 12];
          const rightMouthX = rowOutput[i + 13];
          const rightMouthY = rowOutput[i + 14];
          const category = rowOutput[i + 15];
        
          const box = new Box({ x: xMin, y: yMin, width: width, height: height });
          const probability = score as number;
            const landmarks = [
                new Point(leftEyeX, leftEyeY),
                new Point(rightEyeX, rightEyeY),
                new Point(noseX, noseY),
                new Point(leftMouthX, leftMouthY),
                new Point(rightMouthX, rightMouthY),
            ];
            const face: FaceDetection = {
                box,
                landmarks,
                probability,
                // detectionMethod: this.method,
            };
        faces.push(face);

    }
    return faces;
}
    private async estimateOnnx(imageBitmap: ImageBitmap) {
        const maxFaceDistance = imageBitmap.width * MAX_FACE_DISTANCE_PERCENT;
        const resized = resizeToSquare(imageBitmap, 640);
        var data = this.imageBitmapToTensorData(resized.image).data;
        var inputTensor = new ort.Tensor('float32', data, [1, 3, 640, 640]);
        const feeds: Record<string, ort.Tensor> = {};
        feeds['input'] = inputTensor;
        const inferenceSession = await this.getOnnxInferenceSession();
        var runout = await inferenceSession.run(feeds);
        const outputData = runout.output.data;
        const faces = this.getFacesFromYoloOutput(outputData as Float32Array, 0.7);
        const inBox = newBox(0, 0, resized.width, resized.height);
        const toBox = newBox(0, 0, imageBitmap.width, imageBitmap.height);
        const transform = computeTransformToBox(inBox, toBox);
        const faceDetections: Array<FaceDetection> = faces?.map((f) => {
            const box = transformBox(f.box, transform);
            const normLandmarks = f.landmarks;
            const landmarks = transformPoints(normLandmarks, transform);
            return {
                box,
                landmarks,
                probability: f.probability as number,
        
            } as FaceDetection;
        });
        return removeDuplicateDetections(faceDetections, maxFaceDistance);
    }

    public async detectFaces(
        imageBitmap: ImageBitmap
    ): Promise<Array<FaceDetection>> {
        const facesFromOnnx = await this.estimateOnnx(imageBitmap);
        return facesFromOnnx;
    }

    public async dispose() {
        const inferenceSession = await this.getOnnxInferenceSession();
        inferenceSession?.release();
        this.onnxInferenceSession = undefined;
    }
}

export default new YoloFaceDetectionService();
