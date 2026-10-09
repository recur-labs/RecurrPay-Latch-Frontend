/**
 * `expiration_ledger` is a ledger sequence, not a timestamp. Converting it to a
 * date is a projection and is presented as one — see docs/adr/0002.
 */

export interface ExpiryInput {
  readonly expirationLedger: number;
  readonly currentLedger: number;
  readonly closeIntervalSeconds: number;
  /** Wall-clock now, injectable so this is testable without waiting. */
  readonly now: Date;
}

export type ExpiryPrecision = "expired" | "hours" | "days" | "months";

export interface Expiry {
  /** True when the current ledger is already past expiration. Not a guess. */
  readonly expired: boolean;
  readonly ledgersRemaining: number;
  /** Null when already expired. */
  readonly approximateDate: Date | null;
  readonly precision: ExpiryPrecision;
  /** Human phrasing at a precision that reflects the confidence. */
  readonly label: string;
}

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;

export function projectExpiry(input: ExpiryInput): Expiry {
  const { expirationLedger, currentLedger, closeIntervalSeconds, now } = input;

  if (closeIntervalSeconds <= 0) {
    throw new RangeError("closeIntervalSeconds must be positive");
  }

  const ledgersRemaining = expirationLedger - currentLedger;

  if (ledgersRemaining <= 0) {
    return {
      expired: true,
      ledgersRemaining,
      approximateDate: null,
      precision: "expired",
      label: "expired",
    };
  }

  const seconds = ledgersRemaining * closeIntervalSeconds;
  const date = new Date(now.getTime() + seconds * 1000);

  if (seconds < SECONDS_PER_DAY) {
    const hours = Math.max(1, Math.round(seconds / SECONDS_PER_HOUR));
    return {
      expired: false,
      ledgersRemaining,
      approximateDate: date,
      precision: "hours",
      label: `expires in about ${hours} hour${hours === 1 ? "" : "s"}`,
    };
  }

  const days = Math.round(seconds / SECONDS_PER_DAY);
  if (days <= 30) {
    return {
      expired: false,
      ledgersRemaining,
      approximateDate: date,
      precision: "days",
      label: `expires in about ${days} day${days === 1 ? "" : "s"} (around ${shortDate(date)})`,
    };
  }

  return {
    expired: false,
    ledgersRemaining,
    approximateDate: date,
    precision: "months",
    label: `expires around ${monthYear(date)}`,
  };
}

function shortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function monthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
