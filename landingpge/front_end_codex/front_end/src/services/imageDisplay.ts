import type { ImageDisplay } from "../types/domain";
export function normalizeImageDisplay(
  value?: ImageDisplay,
  defaultFit: ImageDisplay["fit"] = "cover",
): ImageDisplay {
  const coordinate = (n?: number) =>
    Number.isFinite(n) ? Math.max(0, Math.min(100, n!)) : 50;
  return {
    fit:
      value?.fit === "contain" || value?.fit === "cover"
        ? value.fit
        : defaultFit,
    x: coordinate(value?.x),
    y: coordinate(value?.y),
  };
}
export function imageDisplayStyle(value?: ImageDisplay) {
  if (!value) return undefined;
  const display = normalizeImageDisplay(value);
  return {
    objectFit: display.fit,
    objectPosition: `${display.x}% ${display.y}%`,
  };
}
