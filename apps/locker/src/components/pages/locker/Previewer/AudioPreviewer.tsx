const AudioPreviewer = ({ url }: { url: string }) => {
    return <source src={url} type="audio/mp3" />;
};

export default AudioPreviewer;
