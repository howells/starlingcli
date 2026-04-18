import { describe, expect, it } from "vitest";
import { formatMoney } from "./api.ts";

describe("formatMoney", () => {
  it("formats GBP with pound symbol", () => {
    expect(formatMoney({ currency: "GBP", minorUnits: 1234 })).toBe("£12.34");
  });

  it("formats zero", () => {
    expect(formatMoney({ currency: "GBP", minorUnits: 0 })).toBe("£0.00");
  });

  it("formats large amounts", () => {
    expect(formatMoney({ currency: "GBP", minorUnits: 2500000 })).toBe(
      "£25000.00",
    );
  });

  it("formats single pence", () => {
    expect(formatMoney({ currency: "GBP", minorUnits: 1 })).toBe("£0.01");
  });

  it("uses currency code for non-GBP", () => {
    expect(formatMoney({ currency: "EUR", minorUnits: 5000 })).toBe("EUR50.00");
  });

  it("uses currency code for USD", () => {
    expect(formatMoney({ currency: "USD", minorUnits: 9999 })).toBe("USD99.99");
  });
});
