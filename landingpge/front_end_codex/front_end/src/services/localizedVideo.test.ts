import { describe, expect, it } from "vitest";
import { localizedVideo } from "./localizedVideo";
import { normalizeSettings } from "./contacts";
describe("localized video", () => {
  it("selects English when configured", () =>
    expect(localizedVideo("vi.mp4", "en.mp4", "en")).toBe("en.mp4"));
  it("falls back to Vietnamese when English is absent or blank", () => {
    expect(localizedVideo("vi.mp4", undefined, "en")).toBe("vi.mp4");
    expect(localizedVideo("vi.mp4", "  ", "en")).toBe("vi.mp4");
  });
  it("selects Vietnamese independently", () =>
    expect(localizedVideo("vi.mp4", "en.mp4", "vi")).toBe("vi.mp4"));
  it("keeps homepage video empty instead of inheriting product videos", () => {
    expect(normalizeSettings({}).homeVideo).toBe("");
    expect(localizedVideo("", "", "en")).toBe("");
    expect(localizedVideo("", "en.mp4", "en")).toBe("en.mp4");
  });
});
