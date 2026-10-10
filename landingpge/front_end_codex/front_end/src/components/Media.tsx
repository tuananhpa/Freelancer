import {
  useState,
  useEffect,
  forwardRef,
  type ImgHTMLAttributes,
  type VideoHTMLAttributes,
} from "react";
import { resolveMediaUrl } from "../services/mediaLibrary";
import { useSiteSettings } from "../app/appearance";
import { imageDisplayStyle } from "../services/imageDisplay";
import type { ImageDisplay } from "../types/domain";
import { useVideoAspect } from "../hooks/useVideoAspect";
export function useMediaSource(reference?: string) {
  const [source, setSource] = useState(
    reference?.startsWith("local-media:") ? "" : reference || "",
  );
  useEffect(() => {
    let active = true;
    setSource(reference?.startsWith("local-media:") ? "" : reference || "");
    if (reference?.startsWith("local-media:"))
      void resolveMediaUrl(reference)
        .then((url) => {
          if (active) setSource(url);
        })
        .catch(() => {
          if (active) setSource("");
        });
    return () => {
      active = false;
    };
  }, [reference]);
  return source;
}
export function MediaImage({
  src,
  display,
  style,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { display?: ImageDisplay }) {
  const resolved = useMediaSource(src);
  const settings = useSiteSettings();
  return (
    <img
      {...props}
      style={{
        ...imageDisplayStyle(display ?? settings.imageDisplays[src ?? ""]),
        ...style,
      }}
      src={resolved || "/media/placeholder.svg"}
    />
  );
}
export const MediaVideo = forwardRef<
  HTMLVideoElement,
  VideoHTMLAttributes<HTMLVideoElement> & { display?: ImageDisplay }
>(function MediaVideo(
  { src, poster, display, style, onLoadedMetadata, ...props },
  ref,
) {
  const resolved = useMediaSource(src);
  const resolvedPoster = useMediaSource(poster);
  const settings = useSiteSettings();
  const aspect = useVideoAspect(src);
  return (
    <video
      {...props}
      controlsList="nodownload"
      ref={ref}
      style={{
        ...imageDisplayStyle(display ?? settings.imageDisplays[poster ?? ""]),
        ...style,
        ...aspect.frameStyle,
        aspectRatio: aspect.ratio,
        objectFit: "contain",
      }}
      onLoadedMetadata={(event) => {
        aspect.onLoadedMetadata(event);
        onLoadedMetadata?.(event);
      }}
      src={resolved || undefined}
      poster={resolvedPoster || "/media/placeholder.svg"}
    />
  );
});
