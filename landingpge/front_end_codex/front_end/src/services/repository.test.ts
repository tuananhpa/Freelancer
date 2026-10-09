import { describe, it, expect, beforeEach } from "vitest";
import { createMockRepository } from "./mockRepository";
import { createProductDraft } from "./productDraft";

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
};
describe("demo repository", () => {
  beforeEach(() => memory.clear());
  it("persists admin quick replies and greeting including an explicitly empty collection", async () => {
    const repo = createMockRepository(storage);
    const original = await repo.settings.get();
    await repo.settings.save({
      ...original,
      chatGreeting: { vi: "Chào bạn!", en: "Hello!" },
      quickReplies: [
        {
          id: "custom",
          enabled: false,
          question: { vi: "Câu hỏi mới", en: "New question" },
          answer: { vi: "Nội dung mới", en: "New answer" },
        },
      ],
    });
    const restored = await createMockRepository(storage).settings.get();
    expect(restored.quickReplies[0].answer.vi).toBe("Nội dung mới");
    expect(restored.quickReplies[0].enabled).toBe(false);
    expect(restored.chatGreeting.en).toBe("Hello!");
    await repo.settings.save({ ...restored, quickReplies: [] });
    expect((await repo.settings.get()).quickReplies).toEqual([]);
  });
  it("provides default quick replies when migrating older stored settings", async () => {
    const repo = createMockRepository(storage);
    await repo.settings.save(await repo.settings.get());
    const state = JSON.parse(memory.get("hytales.demo.v1")!);
    delete state.settings.quickReplies;
    delete state.settings.chatGreeting;
    memory.set("hytales.demo.v1", JSON.stringify(state));
    const restored = await repo.settings.get();
    expect(restored.quickReplies.length).toBeGreaterThan(0);
    expect(restored.chatGreeting.vi).toBeTruthy();
  });
  it("creates a product with automatic editable batch code and internal link", async () => {
    const a = createProductDraft();
    const b = createProductDraft([a]);
    expect(a.batchCode).toMatch(/^HY-\d{4}-[A-F0-9]{8}$/);
    expect(a.batchCode).not.toBe(b.batchCode);
    expect(a.slug).toBeTruthy();
    const repo = createMockRepository(storage);
    const saved = await repo.products.save({
      ...a,
      name: "Sản phẩm mới",
      batchCode: "HY-TUY-CHINH",
    });
    expect(saved.batchCode).toBe("HY-TUY-CHINH");
  });
  it("removes a product from admin, public pages and QR destinations", async () => {
    const repo = createMockRepository(storage);
    const p = (await repo.products.list())[0];
    await repo.products.remove(p.id);
    expect(await repo.products.get(p.slug)).toBeUndefined();
    expect(
      (await createMockRepository(storage).products.list(true)).some(
        (x) => x.id === p.id,
      ),
    ).toBe(false);
  });
  it("persists a new QR destination while keeping the source product identity", async () => {
    const repo = createMockRepository(storage);
    const [a, b] = await repo.products.list();
    await repo.products.save({
      ...a,
      qrDestination: { kind: "product", productId: b.id },
    });
    expect((await repo.products.get(a.slug))?.qrDestination).toEqual({
      kind: "product",
      productId: b.id,
    });
  });
  it("migrates old contact settings and preserves configurable channels", async () => {
    const repo = createMockRepository(storage);
    const settings = await repo.settings.get();
    await repo.settings.save({
      ...settings,
      socialLinks: [
        {
          id: "fb",
          platform: "facebook",
          label: "Facebook",
          url: "https://www.facebook.com/hytales",
          enabled: false,
        },
      ],
    });
    expect(
      (await createMockRepository(storage).settings.get()).socialLinks[0]
        .enabled,
    ).toBe(false);
  });
  it("persists edits without changing a printed product URL", async () => {
    const repo = createMockRepository(storage);
    const p = (await repo.products.list())[0];
    await repo.products.save({
      ...p,
      name: "Nhãn mùa mới",
      slug: "attempt-to-change",
    });
    const reloaded = await createMockRepository(storage).products.get(p.slug);
    expect(reloaded?.name).toBe("Nhãn mùa mới");
    expect(reloaded?.slug).toBe(p.slug);
  });
  it("recovers from corrupted local storage", async () => {
    memory.set("hytales.demo.v1", "{broken");
    expect((await createMockRepository(storage).products.list()).length).toBe(
      3,
    );
  });
  it("isolates reviews per product and persists a purchase inquiry", async () => {
    const repo = createMockRepository(storage);
    const [a, b] = await repo.products.list();
    await repo.reviews.add({
      productId: a.id,
      name: "Khách",
      rating: 5,
      text: "Rất hay",
    });
    expect((await repo.reviews.list(b.id)).length).toBe(0);
    await repo.inquiries.add({
      name: "Khách",
      phone: "0912345678",
      note: "Tặng bạn",
      type: "purchase",
      productId: a.id,
      quantity: 1,
      unit: "kg",
    });
    expect((await repo.inquiries.list())[0].note).toBe("Tặng bạn");
  });
  it("does not expose drafts through public queries", async () => {
    const repo = createMockRepository(storage);
    const p = (await repo.products.list())[0];
    await repo.products.save({ ...p, status: "draft" });
    expect(await repo.products.get(p.slug)).toBeUndefined();
    expect((await repo.products.list()).length).toBe(2);
    expect((await repo.products.list(true)).length).toBe(3);
  });
  it("returns undefined for an unknown QR destination", async () => {
    expect(
      await createMockRepository(storage).products.get("missing"),
    ).toBeUndefined();
  });
});
