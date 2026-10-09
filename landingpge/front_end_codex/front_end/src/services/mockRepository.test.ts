import { describe, it, expect } from "vitest";
import { seedProducts } from "../data/products";
import { createMockRepository } from "./mockRepository";

describe("legacy video references", () => {
  it("migrates old default video URLs without losing product edits or custom uploads", async () => {
    const products = structuredClone(seedProducts);
    products[0].video = "/media/nhan-long.mp4";
    products[0].name = "Tên đã chỉnh sửa";
    products[1].video = "local-media:custom-video-id";
    products[2].video = "https://example.com/custom.mp4";
    const serialized = JSON.stringify({
      products,
      reviews: [],
      inquiries: [],
      messages: [],
      settings: {},
    });
    const repository = createMockRepository({
      getItem: () => serialized,
      setItem: () => {
        throw new Error("Read must not overwrite saved data");
      },
    });
    const result = await repository.products.list(true);
    expect(result[0].video).toBe("/hytales-videos/nhan-long.mp4");
    expect(result[0].name).toBe("Tên đã chỉnh sửa");
    expect(result[1].video).toBe(products[1].video);
    expect(result[2].video).toBe(products[2].video);
  });
});
