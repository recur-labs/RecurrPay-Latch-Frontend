import { Networks } from "@stellar/stellar-sdk";

export type NetworkId = "testnet" | "public";

export interface NetworkConfig {
  readonly id: NetworkId;
  readonly label: string;
  readonly rpcUrl: string;
  readonly networkPassphrase: string;
  /**
   * Nominal seconds per ledger close. Used only to project an
   * `expiration_ledger` onto a wall-clock estimate — see docs/adr/0002.
   */
  readonly closeIntervalSeconds: number;
  readonly explorerBase: string;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  testnet: {
    id: "testnet",
    label: "Testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    closeIntervalSeconds: 5,
    explorerBase: "https://stellar.expert/explorer/testnet",
  },
  public: {
    id: "public",
    label: "Mainnet",
    rpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: Networks.PUBLIC,
    closeIntervalSeconds: 5,
    explorerBase: "https://stellar.expert/explorer/public",
  },
};

export const DEFAULT_NETWORK: NetworkId = "testnet";

/** Warn when an allowance has fewer than this many ledgers left (~14 days). */
export const EXPIRY_WARNING_LEDGERS = 241_920;

export function isNetworkId(value: string): value is NetworkId {
  return value === "testnet" || value === "public";
}
