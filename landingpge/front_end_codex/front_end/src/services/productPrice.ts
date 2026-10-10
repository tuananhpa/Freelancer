import type { Product } from "../types/domain";
export function validateProductPrice(product: Pick<Product, "priceVnd">) {
  if (
    product.priceVnd !== undefined &&
    (!Number.isSafeInteger(product.priceVnd) || product.priceVnd < 0)
  ) {
    throw new Error("Giá sản phẩm phải là số nguyên không âm, tính bằng VND.");
  }
}
export function formatUnitPrice(price: number, unit = "kg", locale = "vi-VN") {
  validateProductPrice({ priceVnd: price });
  return `${new Intl.NumberFormat(locale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price)} / ${unit.trim() || "kg"}`;
}
