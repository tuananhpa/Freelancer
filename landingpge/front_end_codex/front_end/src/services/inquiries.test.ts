import { describe, it, expect } from "vitest";
import { normalizeInquiry } from "./inquiries";
import { createMockRepository } from "./mockRepository";

const valid = {
  name: "  Khách  ",
  phone: "0912 345 678",
  note: "",
  type: "purchase" as const,
  productId: "nhan-long",
  quantity: 2.5,
  unit: "kg",
};
describe("inquiry validation", () => {
  it("requires meaningful name and phone digits rather than spaces", () => {
    for (const invalid of [
      { name: "   " },
      { phone: "          " },
      { phone: "09123" },
      { phone: "091234567x" },
    ])
      expect(() => normalizeInquiry({ ...valid, ...invalid })).toThrow();
    expect(normalizeInquiry(valid).name).toBe("Khách");
  });
  it("requires a product, positive finite quantity and a unit for purchase requests", () => {
    for (const invalid of [
      { productId: "" },
      { quantity: 0 },
      { quantity: -1 },
      { quantity: NaN },
      { quantity: Infinity },
      { unit: "   " },
    ])
      expect(() => normalizeInquiry({ ...valid, ...invalid })).toThrow();
    expect(normalizeInquiry({ ...valid, unit: " giỏ " }).unit).toBe("giỏ");
    expect(() =>
      normalizeInquiry({
        name: "HTX",
        phone: "0912345678",
        note: "",
        type: "partner",
      }),
    ).not.toThrow();
  });
  it("persists quantity and unit, rejects unavailable products, preserves inquiry details after deletion", async () => {
    const memory = new Map<string, string>();
    const repo = createMockRepository({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => {
        memory.set(k, v);
      },
    });
    const p = (await repo.products.list())[0];
    await repo.inquiries.add({ ...valid, productId: p.id, unit: "hộp" });
    await repo.products.remove(p.id);
    const saved = (await repo.inquiries.list())[0];
    expect(saved).toMatchObject({
      name: "Khách",
      productName: p.name,
      quantity: 2.5,
      unit: "hộp",
    });
    await expect(
      repo.inquiries.add({ ...valid, productId: p.id }),
    ).rejects.toThrow();
  });
});
