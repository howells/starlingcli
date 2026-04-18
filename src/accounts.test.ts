import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  allAccounts,
  listConfiguredAccounts,
  resolveAccount,
} from "./accounts.ts";

describe("account discovery", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all STARLING_ vars
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("STARLING_")) delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("discovers accounts from STARLING_*_TOKEN env vars", () => {
    process.env.STARLING_PERSONAL_TOKEN = "tok1";
    process.env.STARLING_BUSINESS_TOKEN = "tok2";

    const accounts = listConfiguredAccounts();
    expect(accounts).toContain("personal");
    expect(accounts).toContain("business");
  });

  it("derives name from env var pattern", () => {
    process.env.STARLING_JOINT_GBP_TOKEN = "tok";

    const accounts = listConfiguredAccounts();
    expect(accounts).toContain("joint-gbp");
  });

  it("handles STARLING_TOKEN as default", () => {
    process.env.STARLING_TOKEN = "tok";

    const accounts = listConfiguredAccounts();
    expect(accounts).toContain("default");
  });

  it("resolves by name", () => {
    process.env.STARLING_PERSONAL_TOKEN = "tok-personal";
    process.env.STARLING_BUSINESS_TOKEN = "tok-business";

    const acct = resolveAccount("business");
    expect(acct.name).toBe("business");
    expect(acct.token).toBe("tok-business");
  });

  it("resolves partial name match", () => {
    process.env.STARLING_PERSONAL_TOKEN = "tok";

    const acct = resolveAccount("pers");
    expect(acct.name).toBe("personal");
  });

  it("throws on unknown account name", () => {
    process.env.STARLING_PERSONAL_TOKEN = "tok";

    expect(() => resolveAccount("savings")).toThrow("No account");
  });

  it("throws when no tokens configured", () => {
    expect(() => resolveAccount(undefined)).toThrow("No Starling tokens");
  });

  it("returns first account when no name given and single account", () => {
    process.env.STARLING_PERSONAL_TOKEN = "tok";

    const acct = resolveAccount(undefined);
    expect(acct.name).toBe("personal");
  });

  it("allAccounts returns all configured", () => {
    process.env.STARLING_PERSONAL_TOKEN = "tok1";
    process.env.STARLING_JOINT_TOKEN = "tok2";
    process.env.STARLING_BUSINESS_TOKEN = "tok3";

    const accounts = allAccounts();
    expect(accounts).toHaveLength(3);
  });

  it("allAccounts throws when none configured", () => {
    expect(() => allAccounts()).toThrow("No Starling tokens");
  });
});
