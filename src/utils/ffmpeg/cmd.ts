export const TranscodeVideoCmd = [
    'FFMPEG',
    '-i',
    'INPUT',
    '-preset',
    'veryfast',
    '-movflags',
    'frag_keyframe+empty_moov+default_base_moof',
    '-g',
    '52',
    '-acodec',
    'aac',
    '-vcodec',
    'libx264',
    '-filter:v',
    'scale=720:-2',
    '-crf',
    '28',
    'OUTPUT',
];

export const MP4 = 'mp4';
