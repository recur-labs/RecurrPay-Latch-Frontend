/**
 * Wallet adapter. Latch never holds a key and contains no signing code: it
 * hands an unsigned XDR to the wallet and takes back a signed one.
 *
 * Freighter first; the interface is deliberately narrow so other SEP-43
 * wallets can be added behind it without touching callers.
 */

export interface Wallet {
  readonly name: string;
  isAvailable(): boolean;
  connect(): Promise<string>;
  signTransaction(xdr: string, opts: SignOptions): Promise<string>;
}

export interface SignOptions {
  readonly networkPassphrase: string;
  readonly address: string;
}

interface FreighterApi {
  isConnected?: () => Promise<boolean | { isConnected: boolean }>;
  setAllowed?: () => Promise<unknown>;
  requestAccess?: () => Promise<{ address?: string; error?: string }>;
  getAddress?: () => Promise<{ address?: string; error?: string }>;
  signTransaction: (
    xdr: string,
    opts: { networkPassphrase: string; address?: string },
  ) => Promise<{ signedTxXdr?: string; error?: string } | string>;
}

declare global {
  interface Window {
    freighterApi?: FreighterApi;
  }
}

export class FreighterWallet implements Wallet {
  readonly name = "Freighter";

  private get api(): FreighterApi | undefined {
    return typeof window === "undefined" ? undefined : window.freighterApi;
  }

  isAvailable(): boolean {
    return this.api !== undefined;
  }

  async connect(): Promise<string> {
    const api = this.api;
    if (!api) throw new WalletError("Freighter is not installed in this browser.");

    const granted = await (api.requestAccess?.() ?? api.getAddress?.());
    if (!granted || granted.error || !granted.address) {
      throw new WalletError(granted?.error ?? "Freighter did not return an address.");
    }
    return granted.address;
  }

  async signTransaction(xdr: string, opts: SignOptions): Promise<string> {
    const api = this.api;
    if (!api) throw new WalletError("Freighter is not installed in this browser.");

    const result = await api.signTransaction(xdr, {
      networkPassphrase: opts.networkPassphrase,
      address: opts.address,
    });

    if (typeof result === "string") return result;
    if (result.error) throw new WalletError(result.error);
    if (!result.signedTxXdr) throw new WalletError("Wallet returned no signed transaction.");
    return result.signedTxXdr;
  }
}

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletError";
  }
}

export function detectWallet(): Wallet | null {
  const freighter = new FreighterWallet();
  return freighter.isAvailable() ? freighter : null;
}
