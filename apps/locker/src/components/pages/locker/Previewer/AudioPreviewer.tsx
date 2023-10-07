const AudioPreviewer = ({ url }: { url: string }) => {
    return <audio src={url} controls />;
};

export default AudioPreviewer;
