import type { Inquiry } from "../types/domain";

export const orderUnits = ["kg", "g", "hộp", "giỏ", "túi", "quả", "bó", "chai"];
export function isValidPhone(phone: string) {
  return (
    /^\+?[\d ()-]+$/.test(phone.trim()) &&
    /^\d{9,15}$/.test(phone.replace(/\D/g, ""))
  );
}
export function normalizeInquiry(
  inquiry: Omit<Inquiry, "id" | "createdAt" | "status">,
) {
  const normalized = {
    ...inquiry,
    name: inquiry.name.trim(),
    phone: inquiry.phone.trim(),
    note: inquiry.note.trim(),
    unit: inquiry.unit?.trim(),
  };
  if (!normalized.name || !isValidPhone(normalized.phone))
    throw new Error("Vui lòng nhập tên và số điện thoại hợp lệ.");
  if (
    normalized.type === "purchase" &&
    (!normalized.productId ||
      !Number.isFinite(normalized.quantity) ||
      normalized.quantity! <= 0 ||
      !normalized.unit)
  )
    throw new Error("Vui lòng chọn sản phẩm, số lượng lớn hơn 0 và đơn vị.");
  return normalized;
}
