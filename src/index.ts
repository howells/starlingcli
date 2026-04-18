#!/usr/bin/env node

import { error, success } from "@howells/cli";
import { flag, getLimit, readResult } from "@howells/cli/args";
import {
  allAccounts,
  listConfiguredAccounts,
  resolveAccount,
} from "./accounts.ts";
import * as commands from "./commands.ts";
import { validateAccountName, validateDate } from "./validate.ts";

const command = process.argv[2];

function getToken(cmd: string): { name: string; token: string } {
  const acctName = flag("account");
  if (acctName && acctName !== "all") validateAccountName(acctName, cmd);
  try {
    return resolveAccount(acctName);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err), cmd);
  }
}

// --- Commands ---

switch (command) {
  case "balance": {
    const acctName = flag("account");
    if (acctName) validateAccountName(acctName, "balance");
    if (acctName === "all" || (!acctName && allAccounts().length > 1)) {
      const tokens = allAccounts();
      commands
        .allBalances(tokens)
        .then((data) => success(data, "balance", { account: "all" }));
    } else {
      const { name, token } = getToken("balance");
      commands
        .balance(token)
        .then((data) => success(data, "balance", { account: name }));
    }
    break;
  }

  case "transactions": {
    const { name, token } = getToken("transactions");
    const since = flag("since");
    if (since) validateDate(since, "since", "transactions");
    commands
      .transactions(token, { since, limit: getLimit("transactions") })
      .then((data) =>
        readResult(
          "transactions",
          data as unknown as Record<string, unknown>[],
          { account: name },
        ),
      );
    break;
  }

  case "payees": {
    const { name, token } = getToken("payees");
    commands.payees(token).then((data) =>
      readResult("payees", data as unknown as Record<string, unknown>[], {
        account: name,
      }),
    );
    break;
  }

  case "standing-orders": {
    const { name, token } = getToken("standing-orders");
    commands
      .standingOrders(token)
      .then((data) =>
        readResult(
          "standing-orders",
          data as unknown as Record<string, unknown>[],
          { account: name },
        ),
      );
    break;
  }

  case "direct-debits": {
    const { name, token } = getToken("direct-debits");
    commands
      .directDebits(token)
      .then((data) =>
        readResult(
          "direct-debits",
          data as unknown as Record<string, unknown>[],
          { account: name },
        ),
      );
    break;
  }

  case "savings": {
    const { name, token } = getToken("savings");
    commands.savingsGoals(token).then((data) =>
      readResult("savings", data as unknown as Record<string, unknown>[], {
        account: name,
      }),
    );
    break;
  }

  case "accounts": {
    const acctName = flag("account");
    if (acctName) {
      validateAccountName(acctName, "accounts");
      const { name, token } = getToken("accounts");
      commands
        .accounts(token)
        .then((data) => success(data, "accounts", { account: name }));
    } else {
      success(
        {
          configured: listConfiguredAccounts(),
          note: "Use --account <name> to query sub-accounts for a specific account",
        },
        "accounts",
      );
    }
    break;
  }

  case "schema":
    success(
      {
        cli: "starlingcli",
        version: "0.3.0",
        description: "Agent-first CLI for Starling Bank",
        accounts: listConfiguredAccounts(),
        auth: "Set STARLING_<NAME>_TOKEN env vars (e.g. STARLING_PERSONAL_TOKEN). Name is derived from the env var.",
        commands: {
          balance: {
            description: "Account balance (use --account all for all accounts)",
            params: {
              account: { type: "string", description: "Account name or 'all'" },
            },
          },
          transactions: {
            description: "Recent transactions",
            params: {
              account: { type: "string" },
              since: {
                type: "string",
                format: "ISO 8601",
                description: "Default: 7 days ago",
              },
              limit: { type: "integer", description: "Max results" },
              fields: {
                type: "string",
                description: "Comma-separated field names",
              },
            },
            fields: [
              "id",
              "direction",
              "amount",
              "amountMinorUnits",
              "counterParty",
              "reference",
              "date",
              "status",
              "category",
            ],
          },
          payees: {
            description: "List payees",
            params: {
              account: { type: "string" },
              fields: { type: "string" },
              limit: { type: "integer" },
            },
            fields: ["id", "name", "type"],
          },
          "standing-orders": {
            description: "List standing orders",
            params: {
              account: { type: "string" },
              fields: { type: "string" },
              limit: { type: "integer" },
            },
            fields: [
              "id",
              "payee",
              "amount",
              "amountMinorUnits",
              "reference",
              "frequency",
              "startDate",
              "cancelled",
            ],
          },
          "direct-debits": {
            description: "List direct debits",
            params: {
              account: { type: "string" },
              fields: { type: "string" },
              limit: { type: "integer" },
            },
            fields: [
              "id",
              "originator",
              "reference",
              "status",
              "lastDate",
              "lastAmount",
            ],
          },
          savings: {
            description: "List savings goals",
            params: {
              account: { type: "string" },
              fields: { type: "string" },
              limit: { type: "integer" },
            },
            fields: ["id", "name", "target", "saved", "percentage", "state"],
          },
          accounts: {
            description: "List configured accounts or sub-accounts",
            params: { account: { type: "string" } },
          },
        },
        flags: {
          "--account":
            "Account name derived from STARLING_<NAME>_TOKEN env vars, or 'all'",
          "--since": "ISO 8601 date for transactions (default: 7 days ago)",
          "--limit": "Max results (positive integer)",
          "--fields":
            "Comma-separated field names to return (alphanumeric only)",
        },
      },
      "schema",
    );
    break;

  case "help":
  case "--help":
  case "-h":
    success(
      {
        usage:
          "starlingcli <command> [--account <name>|all] [--fields ...] [--limit N]",
        commands: [
          "balance",
          "transactions",
          "payees",
          "standing-orders",
          "direct-debits",
          "savings",
          "accounts",
          "schema",
        ],
        flags: {
          "--account":
            "Account name (default: first configured). Use 'all' for all balances.",
          "--since": "ISO 8601 date for transactions (default: 7 days ago)",
          "--limit": "Max results",
          "--fields": "Comma-separated field names to return",
        },
      },
      "help",
    );
    break;

  case undefined:
    error("No command provided. Run 'starlingcli help' for usage.");
    break;

  default:
    error(`Unknown command: "${command}". Run 'starlingcli help' for usage.`);
    break;
}
