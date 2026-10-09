import { describe, it, expect, vi, afterEach } from "vitest";
import { apiRepository, request } from "./apiRepository";
afterEach(() => vi.unstubAllGlobals());
describe("backend adapter errors", () => {
  it("validates contact details before posting and sends product quantity/unit in the API payload", async () => {
    const fetcher = vi.fn(
      async (_url: string, options: RequestInit) =>
        new Response(options.body as string, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetcher);
    const inquiry = {
      name: " Khách ",
      phone: "0912345678",
      note: "",
      type: "purchase" as const,
      productId: "nhan-long",
      quantity: 3,
      unit: "hộp",
    };
    await expect(
      apiRepository.inquiries.add({ ...inquiry, phone: " " }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    await apiRepository.inquiries.add(inquiry);
    expect(JSON.parse(fetcher.mock.calls[0][1].body as string)).toMatchObject({
      name: "Khách",
      productId: "nhan-long",
      quantity: 3,
      unit: "hộp",
    });
  });
  it("maps a backend 404 with a custom message to an unavailable story", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ message: "Sản phẩm không tồn tại" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
    );
    await expect(
      apiRepository.products.get("missing"),
    ).resolves.toBeUndefined();
  });
  it("keeps permission errors visible instead of masking them as missing products", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ message: "Phiên hết hạn" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    );
    await expect(apiRepository.products.get("nhan")).rejects.toThrow(
      "Phiên hết hạn",
    );
  });
  it("handles a successful 204 mutation without reading a nonexistent body", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }));
    await expect(
      request("/admin/messages/1/reply", "POST", { reply: "Hello" }),
    ).resolves.toBeUndefined();
  });
});
