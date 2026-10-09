import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  rpc,
} from "@stellar/stellar-sdk";
import type { NetworkConfig } from "./config.js";
import { AllowanceReader } from "./allowance.js";
import type { Wallet } from "./wallet.js";

export type RevokeOutcome =
  | { readonly ok: true; readonly txHash: string; readonly confirmedZero: boolean }
  | { readonly ok: false; readonly reason: string };

/**
 * Revoking is `approve(from, spender, 0, 0)`. Latch builds it unsigned, the
 * wallet signs it, and success is confirmed by re-reading the allowance rather
 * than by trusting the submission — see CONTRIBUTING.md.
 */
export async function revoke(
  network: NetworkConfig,
  wallet: Wallet,
  params: {
    readonly tokenContractId: string;
    readonly from: string;
    readonly spender: string;
  },
): Promise<RevokeOutcome> {
  const server = new rpc.Server(network.rpcUrl, {
    allowHttp: network.rpcUrl.startsWith("http://"),
  });

  let preparedXdr: string;
  try {
    const account = await server.getAccount(params.from);
    const contract = new Contract(params.tokenContractId);

    const tx = new TransactionBuilder(new Account(account.accountId(), account.sequenceNumber()), {
      fee: BASE_FEE,
      networkPassphrase: network.networkPassphrase,
    })
      .addOperation(
        contract.call(
          "approve",
          new Address(params.from).toScVal(),
          new Address(params.spender).toScVal(),
          nativeToScVal(0n, { type: "i128" }),
          nativeToScVal(0, { type: "u32" }),
        ),
      )
      .setTimeout(60)
      .build();

    preparedXdr = (await server.prepareTransaction(tx)).toXDR();
  } catch (error) {
    return { ok: false, reason: describe(error) };
  }

  let signedXdr: string;
  try {
    signedXdr = await wallet.signTransaction(preparedXdr, {
      networkPassphrase: network.networkPassphrase,
      address: params.from,
    });
  } catch (error) {
    return { ok: false, reason: describe(error) };
  }

  try {
    const signed = TransactionBuilder.fromXDR(signedXdr, network.networkPassphrase);
    const sent = await server.sendTransaction(signed);
    if (sent.status === "ERROR") {
      return { ok: false, reason: `submission rejected (${sent.hash})` };
    }

    const settled = await confirm(server, sent.hash);
    if (!settled) {
      return {
        ok: false,
        reason:
          `transaction ${sent.hash} did not confirm in time — it may still succeed, ` +
          `so re-check this allowance before retrying`,
      };
    }

    const reader = new AllowanceReader(network);
    const after = await reader
      .read(params.tokenContractId, params.from, params.spender)
      .catch(() => null);

    return { ok: true, txHash: sent.hash, confirmedZero: after === 0n };
  } catch (error) {
    return { ok: false, reason: describe(error) };
  }
}

async function confirm(server: rpc.Server, hash: string, timeoutSeconds = 30): Promise<boolean> {
  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    const result = await server.getTransaction(hash);
    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) return true;
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) return false;
    await sleep(1000);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
