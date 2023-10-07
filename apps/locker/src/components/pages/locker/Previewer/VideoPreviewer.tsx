const VideoPreviewer = ({ url }: { url: string }) => {
    return (
        <video
            src={url}
            controls
            style={{
                borderRadius: '10px',
                userSelect: 'none',
                width: '100%',
                height: '100%',
            }}
        />
    );
};

export default VideoPreviewer;
