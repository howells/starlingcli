import { error } from "./output.ts";

/** Check if a string contains ASCII control characters (0x00-0x1F). */
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) < 0x20) return true;
  }
  return false;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/;

/**
 * Validate an ISO 8601 date or datetime string.
 * Rejects natural language dates, path traversals, and control characters.
 */
export function validateDate(
  value: string,
  field: string,
  command: string,
): void {
  if (hasControlChars(value)) {
    error(`Invalid ${field}: contains control characters.`, command);
  }
  if (value.includes("..") || value.includes("/")) {
    error(`Invalid ${field}: contains path traversal characters.`, command);
  }
  if (!ISO_DATE_PATTERN.test(value)) {
    error(
      `Invalid ${field}: "${value}". Must be ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ).`,
      command,
    );
  }
}

/**
 * Validate an account name.
 * Rejects control characters, path traversals, and percent-encoded segments.
 */
export function validateAccountName(value: string, command: string): void {
  if (hasControlChars(value)) {
    error(`Invalid account name: contains control characters.`, command);
  }
  if (value.includes("..") || value.includes("/") || value.includes("\\")) {
    error(`Invalid account name: contains path traversal characters.`, command);
  }
  if (value.includes("%") || value.includes("?") || value.includes("#")) {
    error(
      `Invalid account name: contains encoded or query characters.`,
      command,
    );
  }
  if (value.length > 64) {
    error(`Invalid account name: too long (max 64 characters).`, command);
  }
}

/**
 * Validate a positive integer string.
 */
export function validatePositiveInt(
  value: string,
  field: string,
  command: string,
): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    error(`Invalid ${field}: "${value}". Must be a positive integer.`, command);
  }
  return n;
}

/**
 * Validate a fields filter string.
 * Must be comma-separated alphanumeric field names.
 */
export function validateFields(value: string, command: string): void {
  const fields = value.split(",").map((f) => f.trim());
  for (const field of fields) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(field)) {
      error(
        `Invalid field name: "${field}". Fields must be alphanumeric.`,
        command,
      );
    }
  }
}
