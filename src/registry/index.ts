import { Asset } from "@stellar/stellar-sdk";
import type { NetworkConfig, NetworkId } from "../config.js";
import registry from "./tokens.json";

export interface TokenEntry {
  readonly symbol: string;
  /** "native", or the asset code for a classic asset wrapped as a SAC. */
  readonly code: string;
  readonly issuer: string | null;
  readonly decimals: number;
  readonly networks: readonly NetworkId[];
}

export interface SpenderEntry {
  readonly name: string;
  readonly contractId: string;
  readonly networks: readonly NetworkId[];
  readonly url?: string;
}

export interface ResolvedToken extends TokenEntry {
  /** Derived, never hardcoded — see contractIdFor. */
  readonly contractId: string;
}

const TOKENS = registry.tokens as unknown as TokenEntry[];
const SPENDERS = registry.spenders as unknown as SpenderEntry[];

/**
 * A classic asset's Stellar Asset Contract id is deterministic, so it is
 * derived from the asset and network rather than pasted into the registry.
 * One less thing that can be wrong, and one less thing to keep in sync.
 */
export function contractIdFor(token: TokenEntry, networkPassphrase: string): string {
  const asset =
    token.issuer === null || token.code === "native"
      ? Asset.native()
      : new Asset(token.code, token.issuer);
  return asset.contractId(networkPassphrase);
}

export function tokensFor(network: NetworkConfig): ResolvedToken[] {
  return TOKENS.filter((t) => t.networks.includes(network.id)).map((token) => ({
    ...token,
    contractId: contractIdFor(token, network.networkPassphrase),
  }));
}

export function spendersFor(network: NetworkConfig): SpenderEntry[] {
  return SPENDERS.filter((s) => s.networks.includes(network.id));
}
