# @howells/starlingcli

CLI for [Starling Bank](https://www.starlingbank.com/) — balances, transactions, payees, standing orders, direct debits, and savings goals.

Designed for AI agents and automation. All output is structured JSON. Supports multiple accounts.

## Install

```bash
npm install -g @howells/starlingcli
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
starlingcli balance                          # Balance (first configured account)
starlingcli balance --account all            # All account balances
starlingcli balance --account business       # Specific account

starlingcli transactions                     # Last 7 days
starlingcli transactions --since 2026-04-01  # Since date
starlingcli transactions --limit 5           # Limit results
starlingcli transactions --fields counterParty,amount,date  # Select fields

starlingcli payees                           # List payees
starlingcli standing-orders                  # List standing orders
starlingcli direct-debits                    # List direct debits
starlingcli savings                          # List savings goals

starlingcli accounts                         # List configured accounts
starlingcli schema                           # Schema introspection (for agents)
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
