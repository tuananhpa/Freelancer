export function isReviewImage(url: string) {
  return (
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z\d+/=]+$/.test(url) ||
    /^https:\/\//.test(url) ||
    /^\/(?!\/)/.test(url)
  );
}
export function originalVideoUrl(source?: string) {
  return source &&
    /^\/(media|hytales-videos)\/(nhan-long|vai-trung|cam-duong-canh)\.mp4$/.test(
      source,
    )
    ? source.replace(/^\/media\//, "/hytales-videos/")
    : undefined;
}
