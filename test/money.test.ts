import { describe, expect, it } from "vitest";
import { formatStroops, parseAmount, percentRemaining } from "../src/money.js";

describe("formatStroops", () => {
  it("formats whole units", () => {
    expect(formatStroops(10_0000000n)).toBe("10");
  });

  it("trims trailing zeroes but keeps significant decimals", () => {
    expect(formatStroops(10_5000000n)).toBe("10.5");
    expect(formatStroops(1n)).toBe("0.0000001");
  });

  it("formats zero and negatives", () => {
    expect(formatStroops(0n)).toBe("0");
    expect(formatStroops(-2_5000000n)).toBe("-2.5");
  });

  it("honours a non-default precision", () => {
    expect(formatStroops(12345n, 2)).toBe("123.45");
  });
});

describe("parseAmount", () => {
  it("round-trips through formatStroops", () => {
    for (const input of ["0", "1", "10.5", "0.0000001", "123456.7890123"]) {
      expect(formatStroops(parseAmount(input))).toBe(input);
    }
  });

  it("rejects anything that is not a decimal", () => {
    for (const bad of ["", "abc", "1.2.3", "1e5", " "]) {
      expect(() => parseAmount(bad)).toThrow();
    }
  });

  it("refuses to silently lose precision", () => {
    expect(() => parseAmount("0.00000001")).toThrow(RangeError);
  });

  it("never produces a float", () => {
    expect(typeof parseAmount("0.1")).toBe("bigint");
  });
});

describe("percentRemaining", () => {
  it("is null when the granted amount is unknown", () => {
    expect(percentRemaining(5n, null)).toBeNull();
  });

  it("clamps to the 0-100 range", () => {
    expect(percentRemaining(0n, 100n)).toBe(0);
    expect(percentRemaining(150n, 100n)).toBe(100);
    expect(percentRemaining(25n, 100n)).toBe(25);
  });
});
