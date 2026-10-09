export function isReviewImage(url: string) {
  return (
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z\d+/=]+$/.test(url) ||
    /^https:\/\//.test(url) ||
    /^\/(?!\/)/.test(url)
  );
}
