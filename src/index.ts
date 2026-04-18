#!/usr/bin/env node

import {
  allAccounts,
  listConfiguredAccounts,
  resolveAccount,
} from "./accounts.ts";
import * as commands from "./commands.ts";
import { error, filterFields, success } from "./output.ts";

const args = process.argv.slice(2);
const command = args[0];

function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function getToken(cmd: string): { name: string; token: string } {
  try {
    return resolveAccount(flag("account"));
  } catch (err) {
    error(err instanceof Error ? err.message : String(err), cmd);
  }
}

switch (command) {
  case "balance": {
    const acct = flag("account");
    if (acct === "all" || (!acct && allAccounts().length > 1)) {
      const tokens = allAccounts();
      commands
        .allBalances(tokens)
        .then((data) => success(data, "balance", "all"));
    } else {
      const { name, token } = getToken("balance");
      commands.balance(token).then((data) => success(data, "balance", name));
    }
    break;
  }

  case "transactions": {
    const { name, token } = getToken("transactions");
    const since = flag("since");
    const limit = flag("limit") ? Number(flag("limit")) : undefined;
    commands.transactions(token, { since, limit }).then((data) => {
      const filtered = filterFields(
        data as unknown as Record<string, unknown>[],
        flag("fields"),
      );
      success(filtered, "transactions", name);
    });
    break;
  }

  case "payees": {
    const { name, token } = getToken("payees");
    commands.payees(token).then((data) => success(data, "payees", name));
    break;
  }

  case "standing-orders": {
    const { name, token } = getToken("standing-orders");
    commands
      .standingOrders(token)
      .then((data) => success(data, "standing-orders", name));
    break;
  }

  case "direct-debits": {
    const { name, token } = getToken("direct-debits");
    commands
      .directDebits(token)
      .then((data) => success(data, "direct-debits", name));
    break;
  }

  case "savings": {
    const { name, token } = getToken("savings");
    commands.savingsGoals(token).then((data) => success(data, "savings", name));
    break;
  }

  case "accounts": {
    const acct = flag("account");
    if (acct) {
      const { name, token } = getToken("accounts");
      commands.accounts(token).then((data) => success(data, "accounts", name));
    } else {
      success(
        {
          configured: listConfiguredAccounts(),
          note: "Use --account <name> to query a specific account",
        },
        "accounts",
      );
    }
    break;
  }

  case "schema":
    success(
      {
        cli: "starling",
        version: "0.1.0",
        accounts: listConfiguredAccounts(),
        commands: {
          balance: {
            description: "Account balance (use --account all for all accounts)",
            params: {
              account: {
                type: "string",
                description:
                  "Account name from STARLING_<NAME>_TOKEN env vars, or 'all'",
              },
            },
          },
          transactions: {
            description: "Recent transactions",
            params: {
              account: { type: "string", required: true },
              since: {
                type: "string",
                format: "date-time",
                description: "ISO 8601 (default: 7 days ago)",
              },
              limit: { type: "integer" },
              fields: { type: "string" },
            },
          },
          payees: {
            description: "List payees",
            params: { account: { type: "string" } },
          },
          "standing-orders": {
            description: "List standing orders",
            params: { account: { type: "string" } },
          },
          "direct-debits": {
            description: "List direct debits",
            params: { account: { type: "string" } },
          },
          savings: {
            description: "List savings goals",
            params: { account: { type: "string" } },
          },
          accounts: {
            description: "List configured accounts or sub-accounts",
            params: { account: { type: "string" } },
          },
        },
        flags: {
          "--account":
            "Account name derived from STARLING_<NAME>_TOKEN env vars, or 'all'",
          "--since": "ISO date for transactions (default: 7 days ago)",
          "--limit": "Max results",
          "--fields": "Comma-separated field names to return",
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
          "starling <command> [--account <name>|all] [--fields ...] [--limit N]",
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
            "Account name (default: first configured). Use 'all' for balances across all accounts.",
          "--since": "ISO date for transactions (default: 7 days ago)",
          "--limit": "Max results",
          "--fields": "Comma-separated field names to return",
        },
      },
      "help",
    );
    break;

  case undefined:
    error("No command provided. Run 'starling help' for usage.");
    break;

  default:
    error(`Unknown command: "${command}". Run 'starling help' for usage.`);
    break;
}
