# @howells/starling

CLI for [Starling Bank](https://www.starlingbank.com/) — balances, transactions, payees, standing orders, direct debits, and savings goals.

Designed for AI agents and automation. All output is structured JSON. Supports multiple accounts.

## Install

```bash
npm install -g @howells/starling
```

## Setup

Create a personal access token at [developer.starlingbank.com](https://developer.starlingbank.com) and set it as an env var:

```bash
export STARLING_PERSONAL_TOKEN="your-token"
```

For multiple accounts, use the `STARLING_<NAME>_TOKEN` pattern:

```bash
export STARLING_PERSONAL_TOKEN="..."
export STARLING_BUSINESS_TOKEN="..."
export STARLING_JOINT_TOKEN="..."
```

Account names are derived from the env var: `STARLING_BUSINESS_TOKEN` → `--account business`.

## Usage

```bash
starling balance                          # Balance (first configured account)
starling balance --account all            # All account balances
starling balance --account business       # Specific account

starling transactions                     # Last 7 days
starling transactions --since 2026-04-01  # Since date
starling transactions --limit 5           # Limit results
starling transactions --fields counterParty,amount,date  # Select fields

starling payees                           # List payees
starling standing-orders                  # List standing orders
starling direct-debits                    # List direct debits
starling savings                          # List savings goals

starling accounts                         # List configured accounts
starling schema                           # Schema introspection (for agents)
```

## Output Format

All commands return structured JSON:

```json
{
  "ok": true,
  "data": { ... },
  "command": "balance",
  "account": "personal"
}
```

On error:

```json
{
  "ok": false,
  "error": "No Starling tokens found.",
  "command": "balance"
}
```

## Agent Features

- All output is JSON (including errors and help)
- `--fields` for context window discipline
- `--limit` for result size control
- `schema` command for runtime introspection
- Multi-account via env var discovery (`STARLING_*_TOKEN`)
- No dependencies beyond Node.js built-ins

## License

MIT
