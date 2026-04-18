/**
 * Multi-account resolution.
 *
 * Accounts are discovered from env vars matching STARLING_*_TOKEN.
 * The prefix becomes the account name:
 *   STARLING_PERSONAL_TOKEN → "personal"
 *   STARLING_BUSINESS_TOKEN → "business"
 *   STARLING_TOKEN → "default" (single-account fallback)
 */

export interface AccountConfig {
  name: string;
  token: string;
}

function discoverAccounts(): AccountConfig[] {
  const accounts: AccountConfig[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("STARLING_") || !key.endsWith("_TOKEN") || !value)
      continue;
    if (key === "STARLING_TOKEN") {
      accounts.push({ name: "default", token: value });
      continue;
    }
    // STARLING_PERSONAL_TOKEN → "personal"
    // STARLING_JOINT_GBP_TOKEN → "joint-gbp"
    const name = key
      .replace("STARLING_", "")
      .replace("_TOKEN", "")
      .toLowerCase()
      .replace(/_/g, "-");
    accounts.push({ name, token: value });
  }

  return accounts;
}

export function resolveAccount(name: string | undefined): AccountConfig {
  const accounts = discoverAccounts();

  if (name) {
    const key = name.toLowerCase();
    const match = accounts.find((a) => a.name === key);
    if (match) return match;
    // Partial match
    const partial = accounts.find((a) => a.name.startsWith(key));
    if (partial) return partial;
    throw new Error(
      `No account "${name}" found. Available: ${accounts.map((a) => a.name).join(", ") || "none"}. Set STARLING_<NAME>_TOKEN env vars.`,
    );
  }

  if (accounts.length === 0) {
    throw new Error(
      "No Starling tokens found. Set STARLING_<NAME>_TOKEN env vars (e.g. STARLING_PERSONAL_TOKEN).",
    );
  }

  // Return first configured account
  return accounts[0] as AccountConfig;
}

export function allAccounts(): AccountConfig[] {
  const accounts = discoverAccounts();
  if (accounts.length === 0) {
    throw new Error(
      "No Starling tokens found. Set STARLING_<NAME>_TOKEN env vars.",
    );
  }
  return accounts;
}

export function listConfiguredAccounts(): string[] {
  return discoverAccounts().map((a) => a.name);
}
