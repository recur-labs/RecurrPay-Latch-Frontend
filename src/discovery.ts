import type { NetworkConfig } from "./config.js";
import { AllowanceReader } from "./allowance.js";
import { spendersFor, tokensFor, type ResolvedToken, type SpenderEntry } from "./registry/index.js";

export interface Candidate {
  readonly token: ResolvedToken;
  readonly spender: SpenderEntry;
}

export interface FoundAllowance extends Candidate {
  readonly remaining: bigint;
  /**
   * The originally approved amount, when it can be recovered from an `approve`
   * event inside the RPC retention window. Null rather than guessed.
   */
  readonly granted: bigint | null;
  readonly expirationLedger: number | null;
}

export interface ScanResult {
  readonly allowances: readonly FoundAllowance[];
  /** How many (token, spender) pairs were actually checked. */
  readonly checked: number;
  readonly currentLedger: number;
  /**
   * Latch can never prove an account has no other allowances — only that none
   * were found among what it checked. Callers must say so. See ARCHITECTURE.md.
   */
  readonly coverage: "partial";
}

const CONCURRENCY = 6;

/** Every (token, spender) pair worth asking about on this network. */
export function candidatesFor(
  network: NetworkConfig,
  extraSpenders: readonly SpenderEntry[] = [],
): Candidate[] {
  const tokens = tokensFor(network);
  const spenders = [...spendersFor(network), ...extraSpenders];
  const pairs: Candidate[] = [];
  for (const token of tokens) {
    for (const spender of spenders) {
      pairs.push({ token, spender });
    }
  }
  return pairs;
}

export async function scan(
  network: NetworkConfig,
  account: string,
  extraSpenders: readonly SpenderEntry[] = [],
): Promise<ScanResult> {
  const reader = new AllowanceReader(network);
  const candidates = candidatesFor(network, extraSpenders);
  const currentLedger = await reader.currentLedger();

  const found: FoundAllowance[] = [];

  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (candidate) => {
        const remaining = await reader
          .read(candidate.token.contractId, account, candidate.spender.contractId)
          .catch(() => 0n);
        return { candidate, remaining };
      }),
    );
    for (const { candidate, remaining } of results) {
      if (remaining > 0n) {
        found.push({
          ...candidate,
          remaining,
          granted: null,
          expirationLedger: null,
        });
      }
    }
  }

  return {
    allowances: found,
    checked: candidates.length,
    currentLedger,
    coverage: "partial",
  };
}
