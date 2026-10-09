import { describe, expect, it } from "vitest";
import { projectExpiry } from "../src/ledger-time.js";

const NOW = new Date("2026-09-07T12:00:00Z");
const BASE = { currentLedger: 1_000_000, closeIntervalSeconds: 5, now: NOW };

describe("projectExpiry", () => {
  it("reports an already-passed ledger as expired, with no projected date", () => {
    const expiry = projectExpiry({ ...BASE, expirationLedger: 999_999 });
    expect(expiry.expired).toBe(true);
    expect(expiry.approximateDate).toBeNull();
    expect(expiry.label).toBe("expired");
  });

  it("treats the current ledger as expired", () => {
    expect(projectExpiry({ ...BASE, expirationLedger: 1_000_000 }).expired).toBe(true);
  });

  it("uses hours inside a day", () => {
    // 720 ledgers * 5s = 1 hour
    const expiry = projectExpiry({ ...BASE, expirationLedger: 1_000_720 });
    expect(expiry.precision).toBe("hours");
    expect(expiry.label).toContain("1 hour");
  });

  it("uses days inside a month", () => {
    // 17280 ledgers * 5s = 1 day
    const expiry = projectExpiry({ ...BASE, expirationLedger: 1_000_000 + 17_280 * 9 });
    expect(expiry.precision).toBe("days");
    expect(expiry.label).toContain("9 days");
  });

  it("falls back to month precision far out", () => {
    const expiry = projectExpiry({ ...BASE, expirationLedger: 1_000_000 + 17_280 * 200 });
    expect(expiry.precision).toBe("months");
    expect(expiry.approximateDate).toBeInstanceOf(Date);
  });

  it("projects forward from the injected clock, not the real one", () => {
    const expiry = projectExpiry({ ...BASE, expirationLedger: 1_000_000 + 17_280 });
    expect(expiry.approximateDate?.toISOString()).toBe("2026-09-08T12:00:00.000Z");
  });

  it("rejects a non-positive close interval", () => {
    expect(() =>
      projectExpiry({ ...BASE, closeIntervalSeconds: 0, expirationLedger: 2_000_000 }),
    ).toThrow(RangeError);
  });
});
