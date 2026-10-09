/**
 * Amounts are `bigint` stroops everywhere. Formatting happens once, at the
 * render boundary. No float arithmetic touches a balance — see ARCHITECTURE.md.
 */

export const STROOPS_PER_UNIT = 10_000_000n;
export const DEFAULT_DECIMALS = 7;

/** Format stroops as a decimal string, trimming trailing zeroes. */
export function formatStroops(
  stroops: bigint,
  decimals: number = DEFAULT_DECIMALS,
): string {
  if (decimals < 0) throw new RangeError("decimals must not be negative");
  const negative = stroops < 0n;
  const magnitude = negative ? -stroops : stroops;
  const divisor = 10n ** BigInt(decimals);
  const whole = magnitude / divisor;
  const fraction = magnitude % divisor;

  let out = whole.toString();
  if (decimals > 0 && fraction > 0n) {
    const padded = fraction.toString().padStart(decimals, "0");
    out += "." + padded.replace(/0+$/, "");
  }
  return negative ? "-" + out : out;
}

/** Parse a decimal string into stroops. Throws rather than losing precision. */
export function parseAmount(
  input: string,
  decimals: number = DEFAULT_DECIMALS,
): bigint {
  const trimmed = input.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new TypeError(`not a decimal amount: ${input}`);
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  if (fraction.length > decimals) {
    throw new RangeError(
      `amount has more than ${decimals} decimal places: ${input}`,
    );
  }
  const padded = fraction.padEnd(decimals, "0");
  const value = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
  return negative ? -value : value;
}

/**
 * Percentage of an original grant still unspent, 0-100, or null when the
 * granted amount is unknown. Integer maths only.
 */
export function percentRemaining(
  remaining: bigint,
  granted: bigint | null,
): number | null {
  if (granted === null || granted <= 0n) return null;
  if (remaining <= 0n) return 0;
  if (remaining >= granted) return 100;
  return Number((remaining * 100n) / granted);
}
