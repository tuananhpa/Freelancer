export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let r;
  try {
    r = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers: { "content-type": "application/json", "x-nutri-request": "1" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("Mất kết nối. Kiểm tra mạng rồi thử lại.", 0);
  }
  const data = await r
    .json()
    .catch(() => ({ error: "Không đọc được phản hồi server." }));
  if (!r.ok) throw new ApiError(data.error ?? "Có lỗi xảy ra.", r.status);
  return data;
}
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Saigon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const timeNow = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Saigon",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
export const n = (v: number) => Math.round(v).toLocaleString("vi-VN");
export async function uploadImage(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 15 * 1024 * 1024
  )
    throw new Error("Chọn ảnh JPG, PNG hoặc WebP dưới 15MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const data = canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
  return (
    await api<{ id: string }>("/media", "POST", { mime: "image/jpeg", data })
  ).id;
}
export async function subscribePush(key: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    throw new Error(
      "Trình duyệt chưa hỗ trợ Web Push. Trên iPhone hãy thêm app vào Màn hình chính trước.",
    );
  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw new Error("Chưa được cấp quyền thông báo.");
  const reg = await navigator.serviceWorker.ready;
  const str = key.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(
    atob(str + "=".repeat((4 - (str.length % 4)) % 4)),
    (c) => c.charCodeAt(0),
  );
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: bytes,
  });
  await api("/push/subscribe", "POST", sub.toJSON());
}
