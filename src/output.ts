export interface CliResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  command?: string;
  account?: string;
}

export function success(
  data: unknown,
  command?: string,
  account?: string,
): never {
  const result: CliResult = { ok: true, data };
  if (command) result.command = command;
  if (account) result.account = account;
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(0);
}

export function error(message: string, command?: string): never {
  const result: CliResult = { ok: false, error: message };
  if (command) result.command = command;
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(1);
}

export function filterFields(
  items: Record<string, unknown>[],
  fields: string | undefined,
): Record<string, unknown>[] {
  if (!fields) return items;
  const keys = fields.split(",").map((f) => f.trim());
  return items.map((item) => {
    const filtered: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in item) filtered[key] = item[key];
    }
    return filtered;
  });
}
