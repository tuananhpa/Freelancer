import { describe, expect, it } from "vitest";
import { normalizeImageDisplay, imageDisplayStyle } from "./imageDisplay";
import { normalizeSettings } from "./contacts";
describe("saved image framing", () => {
  it("bounds corrupt coordinates and preserves the chosen fit", () => {
    expect(normalizeImageDisplay({ fit: "contain", x: -10, y: 170 })).toEqual({
      fit: "contain",
      x: 0,
      y: 100,
    });
    expect(
      normalizeImageDisplay({ fit: "cover", x: NaN, y: Infinity }),
    ).toEqual({ fit: "cover", x: 50, y: 50 });
    expect(normalizeImageDisplay(undefined, "contain")).toEqual({
      fit: "contain",
      x: 50,
      y: 50,
    });
  });
  it("keeps existing frame CSS when no override is configured", () => {
    expect(imageDisplayStyle()).toBeUndefined();
    expect(imageDisplayStyle({ fit: "cover", x: 15, y: 90 })).toEqual({
      objectFit: "cover",
      objectPosition: "15% 90%",
    });
  });
  it("migrates old settings and retains managed image overrides", () => {
    const old = normalizeSettings({ organization: "HYTales" });
    expect(old.storyImages).toHaveLength(3);
    expect(old.imageDisplays).toEqual({});
    const brandLogo = {
      src: "/brand.png",
      display: { fit: "contain" as const, x: 20, y: 70 },
    };
    const updated = normalizeSettings({
      ...old,
      brandLogo,
      imageDisplays: { "/photo.webp": { fit: "cover", x: 5, y: 80 } },
    });
    expect(updated.brandLogo).toEqual(brandLogo);
    expect(updated.imageDisplays["/photo.webp"].y).toBe(80);
  });
});
