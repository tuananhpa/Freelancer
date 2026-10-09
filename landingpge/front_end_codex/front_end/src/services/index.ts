import { createMockRepository } from "./mockRepository";
import { apiRepository } from "./apiRepository";
export const isMock = import.meta.env.VITE_DATA_MODE !== "api";
export const repository = isMock
  ? createMockRepository(localStorage)
  : apiRepository;
export function productUrl(slug: string) {
  return `${(import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, "")}/p/${encodeURIComponent(slug)}`;
}
export function qrUrl(productId: string) {
  return `${(import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, "")}/q/${encodeURIComponent(productId)}`;
}
