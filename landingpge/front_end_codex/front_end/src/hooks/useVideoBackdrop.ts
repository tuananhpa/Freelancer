import { useEffect, type RefObject } from "react";

// Reuse the player's decoded frame instead of loading/decoding a second video.
export function useVideoBackdrop(
  video: RefObject<HTMLVideoElement | null>,
  canvas: RefObject<HTMLCanvasElement | null>,
  source: string,
) {
  useEffect(() => {
    const player = video.current;
    const surface = canvas.current;
    if (!source || !player || !surface) return;
    const context = surface.getContext("2d", { alpha: false });
    if (!context) return;
    let frame: number | undefined;
    let lastPaint = -Infinity;
    let stopped = false;
    function paint() {
      if (
        !player ||
        !surface ||
        !context ||
        player.readyState < 2 ||
        !player.videoWidth
      )
        return;
      const scale = Math.min(
        1,
        480 / Math.max(player.videoWidth, player.videoHeight),
      );
      const width = Math.max(1, Math.round(player.videoWidth * scale));
      const height = Math.max(1, Math.round(player.videoHeight * scale));
      if (surface.width !== width || surface.height !== height) {
        surface.width = width;
        surface.height = height;
      }
      context.drawImage(player, 0, 0, width, height);
    }
    function next(time: number) {
      if (stopped || !player) return;
      if (time - lastPaint >= 125) {
        paint();
        lastPaint = time;
      }
      frame = player.requestVideoFrameCallback(next);
    }
    player.addEventListener("loadeddata", paint);
    player.addEventListener("seeked", paint);
    player.addEventListener("pause", paint);
    if (typeof player.requestVideoFrameCallback === "function")
      frame = player.requestVideoFrameCallback(next);
    else player.addEventListener("timeupdate", paint);
    paint();
    return () => {
      stopped = true;
      if (frame !== undefined) player.cancelVideoFrameCallback(frame);
      player.removeEventListener("loadeddata", paint);
      player.removeEventListener("seeked", paint);
      player.removeEventListener("pause", paint);
      player.removeEventListener("timeupdate", paint);
    };
  }, [source, video, canvas]);
}
