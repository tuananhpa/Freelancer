import { useState, type CSSProperties, type SyntheticEvent } from "react";

export function useVideoAspect(source?: string) {
  const [metadata, setMetadata] = useState({ source: "", ratio: 9 / 16 });
  const ratio = metadata.source === source ? metadata.ratio : 9 / 16;
  function onLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setMetadata({
        source: source || "",
        ratio: video.videoWidth / video.videoHeight,
      });
    }
  }
  return {
    ratio,
    frameStyle: { "--video-ratio": ratio } as CSSProperties,
    onLoadedMetadata,
  };
}
