import { describe, expect, it, vi } from "vitest";
import { formatMoney } from "./api.ts";

// Mock the api function to avoid hitting the real Starling API
vi.mock("./api.ts", async () => {
  const actual = await vi.importActual("./api.ts");
  return {
    ...actual,
    api: vi.fn(),
  };
});

import { api } from "./api.ts";
import * as commands from "./commands.ts";

const mockApi = vi.mocked(api);

describe("balance", () => {
  it("returns formatted balance for primary account", async () => {
    mockApi
      .mockResolvedValueOnce({
        accounts: [
          {
            accountUid: "uid-1",
            accountType: "PRIMARY",
            defaultCategory: "cat-1",
            currency: "GBP",
            createdAt: "2021-01-01T00:00:00Z",
            name: "Personal",
          },
        ],
      })
      .mockResolvedValueOnce({
        effectiveBalance: { currency: "GBP", minorUnits: 150000 },
        pendingTransactions: { currency: "GBP", minorUnits: 500 },
      });

    const result = await commands.balance("tok");
    expect(result.balance).toBe("£1500.00");
    expect(result.balanceMinorUnits).toBe(150000);
    expect(result.pending).toBe("£5.00");
    expect(result.accountName).toBe("Personal");
  });

  it("throws when no primary account", async () => {
    mockApi.mockResolvedValueOnce({
      accounts: [
        {
          accountUid: "uid-1",
          accountType: "SAVINGS",
          defaultCategory: "cat-1",
          currency: "GBP",
          createdAt: "",
          name: "Saver",
        },
      ],
    });

    await expect(commands.balance("tok")).rejects.toThrow("No primary account");
  });
});

describe("transactions", () => {
  it("maps feed items to structured output", async () => {
    mockApi
      .mockResolvedValueOnce({
        accounts: [
          {
            accountUid: "uid-1",
            accountType: "PRIMARY",
            defaultCategory: "cat-1",
            currency: "GBP",
            createdAt: "",
            name: "Personal",
          },
        ],
      })
      .mockResolvedValueOnce({
        feedItems: [
          {
            feedItemUid: "feed-1",
            categoryUid: "cat-1",
            amount: { currency: "GBP", minorUnits: 4500 },
            direction: "OUT",
            transactionTime: "2026-04-18T10:00:00Z",
            counterPartyName: "Tesco",
            reference: "CARD PAYMENT",
            status: "SETTLED",
            spendingCategory: "GROCERIES",
          },
          {
            feedItemUid: "feed-2",
            categoryUid: "cat-1",
            amount: { currency: "GBP", minorUnits: 250000 },
            direction: "IN",
            transactionTime: "2026-04-15T09:00:00Z",
            counterPartyName: "Sandow",
            reference: "SALARY",
            status: "SETTLED",
            spendingCategory: "INCOME",
          },
        ],
      });

    const result = await commands.transactions("tok", {});
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "feed-1",
      direction: "OUT",
      amount: "£45.00",
      amountMinorUnits: 4500,
      counterParty: "Tesco",
      reference: "CARD PAYMENT",
      date: "2026-04-18T10:00:00Z",
      status: "SETTLED",
      category: "GROCERIES",
    });
    expect(result[1]?.counterParty).toBe("Sandow");
    expect(result[1]?.amount).toBe("£2500.00");
  });

  it("respects limit option", async () => {
    mockApi
      .mockResolvedValueOnce({
        accounts: [
          {
            accountUid: "uid-1",
            accountType: "PRIMARY",
            defaultCategory: "cat-1",
            currency: "GBP",
            createdAt: "",
            name: "Personal",
          },
        ],
      })
      .mockResolvedValueOnce({
        feedItems: [
          {
            feedItemUid: "1",
            categoryUid: "c",
            amount: { currency: "GBP", minorUnits: 100 },
            direction: "OUT",
            transactionTime: "",
            counterPartyName: "A",
            reference: "",
            status: "SETTLED",
            spendingCategory: "OTHER",
          },
          {
            feedItemUid: "2",
            categoryUid: "c",
            amount: { currency: "GBP", minorUnits: 200 },
            direction: "OUT",
            transactionTime: "",
            counterPartyName: "B",
            reference: "",
            status: "SETTLED",
            spendingCategory: "OTHER",
          },
          {
            feedItemUid: "3",
            categoryUid: "c",
            amount: { currency: "GBP", minorUnits: 300 },
            direction: "OUT",
            transactionTime: "",
            counterPartyName: "C",
            reference: "",
            status: "SETTLED",
            spendingCategory: "OTHER",
          },
        ],
      });

    const result = await commands.transactions("tok", { limit: 2 });
    expect(result).toHaveLength(2);
  });
});

describe("allBalances", () => {
  it("handles mixed success and failure", async () => {
    mockApi
      .mockResolvedValueOnce({
        accounts: [
          {
            accountUid: "uid-1",
            accountType: "PRIMARY",
            defaultCategory: "cat-1",
            currency: "GBP",
            createdAt: "",
            name: "Personal",
          },
        ],
      })
      .mockResolvedValueOnce({
        effectiveBalance: { currency: "GBP", minorUnits: 100000 },
        pendingTransactions: { currency: "GBP", minorUnits: 0 },
      })
      .mockRejectedValueOnce(new Error("Starling API 401: invalid_token"));

    const result = await commands.allBalances([
      { name: "personal", token: "good-tok" },
      { name: "business", token: "bad-tok" },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("balance", "£1000.00");
    expect(result[1]).toHaveProperty("error");
    expect((result[1] as { error: string }).error).toContain("401");
  });
});

describe("payees", () => {
  it("maps payee response", async () => {
    mockApi.mockResolvedValueOnce({
      payees: [
        {
          payeeUid: "p1",
          payeeName: "HMRC",
          payeeType: "EXTERNAL",
          accounts: [],
        },
        {
          payeeUid: "p2",
          payeeName: "Cecilia",
          payeeType: "INDIVIDUAL",
          accounts: [],
        },
      ],
    });

    const result = await commands.payees("tok");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "p1", name: "HMRC", type: "EXTERNAL" });
  });
});
