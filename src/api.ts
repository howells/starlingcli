/** Base URL for the Starling Bank API v2. */
const BASE_URL = "https://api.starlingbank.com/api/v2";

/** Options for making a Starling API request. */
export interface ApiOptions {
  /** Personal access token for authentication. */
  token: string;
  /** API path (appended to base URL). */
  path: string;
  /** HTTP method (default: GET). */
  method?: "GET" | "PUT" | "POST" | "DELETE";
  /** Request body (JSON-serialized automatically). */
  body?: unknown;
}

/**
 * Make an authenticated request to the Starling Bank API.
 *
 * @throws Error if the response status is not 2xx.
 */
export async function api<T>({
  token,
  path,
  method = "GET",
  body,
}: ApiOptions): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Starling API ${res.status}: ${text || res.statusText}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return {} as T;
}

/** A monetary amount in Starling's format. */
export interface Money {
  /** ISO 4217 currency code (e.g. "GBP"). */
  currency: string;
  /** Amount in minor units (pence for GBP). */
  minorUnits: number;
}

/**
 * Format a {@link Money} value as a human-readable string.
 *
 * @example formatMoney({ currency: "GBP", minorUnits: 1234 }) // "£12.34"
 */
export function formatMoney(m: Money): string {
  const symbol = m.currency === "GBP" ? "£" : m.currency;
  return `${symbol}${(m.minorUnits / 100).toFixed(2)}`;
}
