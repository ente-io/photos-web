const ImagePreviewer = ({ url }: { url: string }) => {
    return (
        <img
            src={url}
            style={{
                borderRadius: '10px',
                maxHeight: '90%',
                maxWidth: '90%',
            }}
        />
    );
};

export default ImagePreviewer;
