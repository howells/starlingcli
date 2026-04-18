# @howells/starlingcli — Agent Guide

CLI for Starling Bank. Reads account data via the Starling API v2. Multi-account support via env vars.

## Quick Start

```bash
# All balances across configured accounts
starlingcli balance --account all

# Recent transactions with field filtering
starlingcli transactions --account personal --fields counterParty,amount,date --limit 10

# Schema introspection
starlingcli schema
```

## Invariants

- **Always use `--fields`** on transactions. Default includes every field which wastes tokens.
- **Always use `--account`** when multiple accounts are configured. Without it, the first configured account is used.
- **Use `--account all`** with `balance` to get a quick overview of all accounts.
- **All output is JSON** with `{ok, data, error, command, account}` envelope.
- **Tokens come from env vars** matching `STARLING_<NAME>_TOKEN`. No config files.

## Multi-Account

Accounts are auto-discovered from env vars:
- `STARLING_PERSONAL_TOKEN` → `--account personal`
- `STARLING_BUSINESS_TOKEN` → `--account business`
- `STARLING_JOINT_TOKEN` → `--account joint`
- Any `STARLING_<NAME>_TOKEN` pattern works.

## Transaction Fields

Available for `--fields`: `id`, `direction`, `amount`, `amountMinorUnits`, `counterParty`, `reference`, `date`, `status`, `category`

## Common Workflows

### Daily balance check
```bash
starlingcli balance --account all
```

### Recent spending
```bash
starlingcli transactions --account personal --fields counterParty,amount,direction,date --limit 20
```

### Monthly outgoings
```bash
starlingcli transactions --account business --since 2026-04-01 --fields counterParty,amount,direction
```

### Standing order audit
```bash
starlingcli standing-orders --account personal
```
