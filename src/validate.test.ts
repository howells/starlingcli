import { describe, expect, it, vi } from "vitest";

vi.mock("@howells/cli", async () => {
  const actual =
    await vi.importActual<typeof import("@howells/cli")>("@howells/cli");

  const throwError = (message: string, command?: string): never => {
    throw new Error(`[${command}] ${message}`);
  };

  // Re-implement hardenId using our throwing error so tests can assert on the message.
  function hardenId(
    value: string,
    command: string,
    options: { maxLength?: number; label?: string } = {},
  ): void {
    const { maxLength = 128, label = "ID" } = options;

    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) < 0x20) {
        throwError(`Invalid ${label}: contains control characters.`, command);
      }
    }
    if (value.includes("..") || value.includes("/") || value.includes("\\")) {
      throwError(
        `Invalid ${label}: contains path traversal characters.`,
        command,
      );
    }
    if (value.includes("%") || value.includes("?") || value.includes("#")) {
      throwError(
        `Invalid ${label}: contains encoded or query characters.`,
        command,
      );
    }
    if (value.length > maxLength) {
      throwError(
        `Invalid ${label}: too long (max ${maxLength} characters).`,
        command,
      );
    }
  }

  return {
    ...actual,
    error: throwError,
    hardenId,
  };
});

import { validateAccountName, validateDate } from "./validate.ts";

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
