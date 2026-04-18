import { describe, expect, it, vi } from "vitest";

vi.mock("./output.ts", () => ({
  error: (message: string, command?: string) => {
    throw new Error(`[${command}] ${message}`);
  },
  success: () => {},
  filterFields: (t: unknown[]) => t,
}));

import {
  validateAccountName,
  validateDate,
  validateFields,
  validatePositiveInt,
} from "./validate.ts";

describe("validateDate", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(() => validateDate("2026-04-18", "since", "test")).not.toThrow();
  });

  it("accepts ISO datetime", () => {
    expect(() =>
      validateDate("2026-04-18T10:00:00Z", "since", "test"),
    ).not.toThrow();
  });

  it("rejects natural language", () => {
    expect(() => validateDate("last week", "since", "test")).toThrow(
      "ISO 8601",
    );
  });

  it("rejects path traversal", () => {
    expect(() => validateDate("../../etc", "since", "test")).toThrow(
      "path traversal",
    );
  });

  it("rejects control characters", () => {
    expect(() => validateDate("2026\x00-04-18", "since", "test")).toThrow(
      "control characters",
    );
  });
});

describe("validateAccountName", () => {
  it("accepts valid names", () => {
    expect(() => validateAccountName("personal", "test")).not.toThrow();
    expect(() => validateAccountName("joint-gbp", "test")).not.toThrow();
    expect(() => validateAccountName("all", "test")).not.toThrow();
  });

  it("rejects path traversal", () => {
    expect(() => validateAccountName("../etc", "test")).toThrow(
      "path traversal",
    );
  });

  it("rejects percent encoding", () => {
    expect(() => validateAccountName("account%2e", "test")).toThrow("encoded");
  });

  it("rejects query params", () => {
    expect(() => validateAccountName("account?key=val", "test")).toThrow(
      "query",
    );
  });

  it("rejects overly long names", () => {
    expect(() => validateAccountName("a".repeat(65), "test")).toThrow(
      "too long",
    );
  });
});

describe("validatePositiveInt", () => {
  it("accepts positive integers", () => {
    expect(validatePositiveInt("5", "limit", "test")).toBe(5);
    expect(validatePositiveInt("100", "limit", "test")).toBe(100);
  });

  it("rejects zero", () => {
    expect(() => validatePositiveInt("0", "limit", "test")).toThrow("positive");
  });

  it("rejects negative", () => {
    expect(() => validatePositiveInt("-1", "limit", "test")).toThrow(
      "positive",
    );
  });

  it("rejects non-numbers", () => {
    expect(() => validatePositiveInt("abc", "limit", "test")).toThrow(
      "positive",
    );
  });
});

describe("validateFields", () => {
  it("accepts valid field names", () => {
    expect(() =>
      validateFields("amount,date,counterParty", "test"),
    ).not.toThrow();
  });

  it("rejects fields with special characters", () => {
    expect(() => validateFields("amount,../path", "test")).toThrow(
      "alphanumeric",
    );
  });
});
