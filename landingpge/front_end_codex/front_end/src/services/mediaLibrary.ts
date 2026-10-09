import { seedProducts } from "../data/products";
import { isMock } from "./index";
import { apiBase, ApiError } from "./apiRepository";
export type MediaAsset = {
  id: string;
  name: string;
  kind: "image" | "video";
  url: string;
  poster?: string;
};
type LocalAsset = MediaAsset & { blob: Blob };
const prefix = "local-media:";
let dbPromise: Promise<IDBDatabase> | undefined;
const cachedUrls = new Map<string, string>();
function database() {
  if (!dbPromise)
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("hytales-media", 1);
      opening.onupgradeneeded = () =>
        opening.result.createObjectStore("assets", { keyPath: "id" });
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => {
        dbPromise = undefined;
        reject(new Error("Không mở được thư viện trên trình duyệt."));
      };
    });
  return dbPromise;
}
async function readLocal<T>(
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const req = operation(
      db.transaction("assets", "readonly").objectStore("assets"),
    );
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("Không đọc được file đã tải lên."));
  });
}
export async function resolveMediaUrl(reference: string): Promise<string> {
  if (!reference.startsWith(prefix)) return reference;
  const id = reference.slice(prefix.length);
  if (cachedUrls.has(id)) return cachedUrls.get(id)!;
  const asset = await readLocal<LocalAsset | undefined>((s) => s.get(id));
  if (!asset)
    throw new Error("Không tìm thấy file trong thư viện trình duyệt.");
  const url = URL.createObjectURL(asset.blob);
  cachedUrls.set(id, url);
  return url;
}
const builtIn: MediaAsset[] = seedProducts.flatMap((p) => [
  {
    id: `${p.id}-cover`,
    name: `${p.name} – ảnh chính`,
    kind: "image" as const,
    url: p.image,
  },
  ...p.gallery.map((url, i) => ({
    id: `${p.id}-scene-${i}`,
    name: `${p.name} – khung hình ${i + 1}`,
    kind: "image" as const,
    url,
  })),
  {
    id: `${p.id}-film`,
    name: `${p.name} – phim đầy đủ 1080p`,
    kind: "video" as const,
    url: p.video,
    poster: p.image,
  },
]);
export const mediaLibrary = {
  list: async (): Promise<MediaAsset[]> => {
    if (!isMock) {
      const response = await fetch(`${apiBase}/admin/media`, {
        credentials: "include",
      });
      if (!response.ok)
        throw new ApiError("Không tải được thư viện media.", response.status);
      return response.json();
    }
    const local = await readLocal<LocalAsset[]>((s) => s.getAll());
    return [...builtIn, ...local.map(({ blob: _, ...asset }) => asset)];
  },
  upload: async (file: File): Promise<MediaAsset> => {
    const image = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    const video = ["video/mp4", "video/webm"].includes(file.type);
    if (!image && !video)
      throw new Error("Chọn ảnh JPG/PNG/WebP hoặc video MP4/WebM.");
    if (file.size > (image ? 12 : 300) * 1024 * 1024)
      throw new Error(
        image ? "Ảnh cần nhỏ hơn 12 MB." : "Video cần nhỏ hơn 300 MB.",
      );
    if (!isMock) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${apiBase}/admin/media`, {
        method: "POST",
        credentials: "include",
        body,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(
          data?.message || "Không tải lên được file.",
          response.status,
        );
      }
      return response.json();
    }
    const id = crypto.randomUUID();
    const asset: MediaAsset = {
      id,
      name: file.name,
      kind: image ? "image" : "video",
      url: `${prefix}${id}`,
    };
    const db = await database();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("assets", "readwrite");
      transaction.objectStore("assets").put({ ...asset, blob: file });
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () =>
        reject(
          new Error("Không lưu được file. Bộ nhớ trình duyệt có thể đã đầy."),
        );
    });
    return asset;
  },
};
