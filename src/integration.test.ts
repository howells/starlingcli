import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const CLI = "npx tsx src/index.ts";

function run(args: string): {
  ok: boolean;
  data: unknown;
  error?: string;
  command?: string;
  account?: string;
} {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      cwd: import.meta.dirname + "/..",
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env },
    });
    return JSON.parse(stdout);
  } catch (err) {
    const e = err as { stdout?: string };
    if (e.stdout) return JSON.parse(e.stdout);
    throw err;
  }
}

describe("read commands against live API", () => {
  it("balance returns structured data", () => {
    const result = run("balance --account personal");
    expect(result.ok).toBe(true);
    expect(result.command).toBe("balance");
    expect(result.account).toBe("personal");
    const data = result.data as Record<string, unknown>;
    expect(data).toHaveProperty("balance");
    expect(data).toHaveProperty("balanceMinorUnits");
    expect(data).toHaveProperty("currency", "GBP");
  });

  it("balance --account all returns array", () => {
    const result = run("balance --account all");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    const data = result.data as Record<string, unknown>[];
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("account");
  });

  it("transactions returns array with fields", () => {
    const result = run("transactions --account personal --limit 3");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(3);
    if (data.length > 0) {
      const first = data[0] as Record<string, unknown>;
      expect(first).toHaveProperty("counterParty");
      expect(first).toHaveProperty("amount");
      expect(first).toHaveProperty("direction");
    }
  });

  it("transactions --fields filters output", () => {
    const result = run(
      "transactions --account personal --limit 3 --fields counterParty,amount",
    );
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>[];
    if (data.length > 0) {
      const keys = Object.keys(data[0] as Record<string, unknown>);
      expect(keys).toContain("counterParty");
      expect(keys).toContain("amount");
      expect(keys).not.toContain("id");
      expect(keys).not.toContain("category");
    }
  });

  it("payees returns array", () => {
    const result = run("payees --account personal");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("standing-orders returns array", () => {
    const result = run("standing-orders --account personal");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("direct-debits returns array", () => {
    const result = run("direct-debits --account personal");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("accounts lists configured accounts", () => {
    const result = run("accounts");
    expect(result.ok).toBe(true);
    const data = result.data as { configured: string[] };
    expect(data.configured).toContain("personal");
  });
});

describe("schema introspection", () => {
  it("returns full schema", () => {
    const result = run("schema");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.cli).toBe("starlingcli");
    expect(data.commands).toBeDefined();
    expect(data.flags).toBeDefined();
  });

  it("includes field lists per command", () => {
    const result = run("schema");
    const data = result.data as {
      commands: Record<string, { fields?: string[] }>;
    };
    expect(data.commands.transactions.fields).toContain("counterParty");
    expect(data.commands.transactions.fields).toContain("amount");
    expect(data.commands.payees.fields).toContain("name");
  });
});

describe("error handling", () => {
  it("returns structured error for unknown command", () => {
    const result = run("nonexistent");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unknown command");
  });

  it("returns structured error for invalid date", () => {
    const result = run('transactions --account personal --since "last week"');
    expect(result.ok).toBe(false);
    expect(result.error).toContain("ISO 8601");
  });

  it("returns structured error for invalid account", () => {
    const result = run("balance --account ../etc/passwd");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("path traversal");
  });

  it("returns structured error for invalid limit", () => {
    const result = run("transactions --account personal --limit abc");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("positive integer");
  });

  it("returns structured error for invalid fields", () => {
    const result = run("transactions --account personal --fields ../path");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("alphanumeric");
  });
});

describe("help", () => {
  it("returns structured help", () => {
    const result = run("help");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.commands).toBeDefined();
    expect(data.flags).toBeDefined();
  });
});
