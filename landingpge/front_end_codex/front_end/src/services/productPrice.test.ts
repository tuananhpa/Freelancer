import { describe, it, expect } from "vitest";
import { formatUnitPrice, validateProductPrice } from "./productPrice";
describe("product price", () => {
  it("allows an unset price and distinguishes an explicit zero", () => {
    expect(() => validateProductPrice({})).not.toThrow();
    expect(formatUnitPrice(0, "hộp")).toContain("0");
    expect(formatUnitPrice(120000, "giỏ")).toContain("120.000");
    expect(formatUnitPrice(120000, "giỏ")).toContain("/ giỏ");
  });
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid VND amounts: %s",
    (priceVnd) => {
      expect(() => validateProductPrice({ priceVnd })).toThrow();
    },
  );
});
