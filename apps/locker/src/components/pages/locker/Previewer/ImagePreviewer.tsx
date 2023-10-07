const ImagePreviewer = ({ url }: { url: string }) => {
    return (
        <img
            src={url}
            style={{
                borderRadius: '10px',
                userSelect: 'none',
            }}
            draggable={false}
        />
    );
};

export default ImagePreviewer;
