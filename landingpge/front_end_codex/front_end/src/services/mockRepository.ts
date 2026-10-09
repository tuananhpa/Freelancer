import { seedProducts } from "../data/products";
import { normalizeInquiry } from "./inquiries";
import {
  normalizeSettings,
  validateContactSettings,
  isWebUrl,
} from "./contacts";
import type {
  Repository,
  Product,
  Review,
  Inquiry,
  Message,
  Settings,
} from "../types/domain";
type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};
type State = {
  products: Product[];
  reviews: Review[];
  inquiries: Inquiry[];
  messages: Message[];
  settings: Settings;
};
const fresh = (): State => ({
  products: structuredClone(seedProducts),
  reviews: [],
  inquiries: [],
  messages: [],
  settings: normalizeSettings({}),
});
const id = () => crypto.randomUUID();
export function createMockRepository(storage: StorageLike): Repository {
  const key = "hytales.demo.v1";
  const read = (): State => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return fresh();
      const s = JSON.parse(raw);
      if (
        !Array.isArray(s.products) ||
        !Array.isArray(s.reviews) ||
        !Array.isArray(s.inquiries) ||
        !Array.isArray(s.messages) ||
        !s.settings
      )
        return fresh();
      return { ...s, settings: normalizeSettings(s.settings) };
    } catch {
      return fresh();
    }
  };
  const write = (s: State) => {
    try {
      storage.setItem(key, JSON.stringify(s));
    } catch {
      throw new Error(
        "Không thể lưu dữ liệu demo. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.",
      );
    }
  };
  return {
    products: {
      list: async (admin = false) =>
        read().products.filter((p) => admin || p.status === "published"),
      get: async (slug) =>
        read().products.find(
          (p) => p.slug === slug && p.status === "published",
        ),
      save: async (product) => {
        const s = read();
        const old = s.products.find((p) => p.id === product.id);
        const saved = { ...product, slug: old?.slug ?? product.slug };
        if (!saved.slug || !saved.name.trim())
          throw new Error("Vui lòng nhập tên sản phẩm.");
        if (s.products.some((p) => p.id !== saved.id && p.slug === saved.slug))
          throw new Error("Đường dẫn sản phẩm đã tồn tại.");
        if (!saved.batchCode.trim())
          saved.batchCode =
            old?.batchCode ||
            `HY-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        if (
          saved.qrDestination?.kind === "external" &&
          !isWebUrl(saved.qrDestination.url)
        )
          throw new Error(
            "Liên kết đích cần là địa chỉ http:// hoặc https:// hợp lệ.",
          );
        s.products = old
          ? s.products.map((p) => (p.id === saved.id ? saved : p))
          : [...s.products, saved];
        write(s);
        return saved;
      },
      remove: async (productId) => {
        const s = read();
        s.products = s.products.filter((p) => p.id !== productId);
        write(s);
      },
    },
    reviews: {
      list: async (productId) =>
        read().reviews.filter((r) => !productId || r.productId === productId),
      add: async (review) => {
        if (
          !review.name.trim() ||
          !review.text.trim() ||
          review.rating < 1 ||
          review.rating > 5
        )
          throw new Error("Vui lòng điền tên, cảm nhận và chọn 1–5 sao.");
        const s = read();
        const r = { ...review, id: id(), createdAt: new Date().toISOString() };
        s.reviews.unshift(r);
        write(s);
        return r;
      },
    },
    inquiries: {
      list: async () => read().inquiries,
      add: async (inquiry) => {
        const normalized = normalizeInquiry(inquiry);
        const s = read();
        const product = s.products.find(
          (p) => p.id === normalized.productId && p.status === "published",
        );
        if (normalized.type === "purchase" && !product)
          throw new Error(
            "Sản phẩm này không còn nhận yêu cầu. Vui lòng chọn sản phẩm khác.",
          );
        const r = {
          ...normalized,
          productName: product?.name,
          id: id(),
          status: "new" as const,
          createdAt: new Date().toISOString(),
        };
        s.inquiries.unshift(r);
        write(s);
        return r;
      },
      update: async (id, status) => {
        const s = read();
        s.inquiries = s.inquiries.map((x) =>
          x.id === id ? { ...x, status } : x,
        );
        write(s);
      },
    },
    messages: {
      list: async () => read().messages,
      add: async (message) => {
        if (!message.question.trim()) throw new Error("Vui lòng nhập câu hỏi.");
        const s = read();
        const r = { ...message, id: id(), createdAt: new Date().toISOString() };
        s.messages.unshift(r);
        write(s);
        return r;
      },
      reply: async (id, reply) => {
        const s = read();
        s.messages = s.messages.map((m) => (m.id === id ? { ...m, reply } : m));
        write(s);
      },
    },
    settings: {
      get: async () => read().settings,
      save: async (settings) => {
        validateContactSettings(settings);
        const s = read();
        s.settings = {
          ...settings,
          zaloUrl:
            settings.socialLinks.find((x) => x.platform === "zalo" && x.enabled)
              ?.url ?? "",
        };
        write(s);
      },
    },
  };
}
