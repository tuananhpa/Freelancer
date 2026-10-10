import Sheet from '@/components/common/Sheet';

export default function VideoPlayerSheet({ video, onClose }) {
  return (
    <Sheet open={!!video} onClose={onClose} title={video?.title || 'Video'} variant="video">
      {video && <video src={video.videoUrl} poster={video.posterUrl} controls autoPlay playsInline />}
    </Sheet>
  );
}
