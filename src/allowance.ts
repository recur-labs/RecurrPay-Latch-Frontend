import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import type { NetworkConfig } from "./config.js";

/**
 * Reads SEP-41 allowances. Every read here is a simulation: nothing is
 * submitted, nothing is signed, and opening Latch costs no fee.
 */
export class AllowanceReader {
  private readonly server: rpc.Server;

  constructor(private readonly network: NetworkConfig) {
    this.server = new rpc.Server(network.rpcUrl, {
      allowHttp: network.rpcUrl.startsWith("http://"),
    });
  }

  /** Current ledger sequence, needed to turn an expiration into a date. */
  async currentLedger(): Promise<number> {
    const latest = await this.server.getLatestLedger();
    return latest.sequence;
  }

  /**
   * `allowance(from, spender)` — how much of the approval is still unspent.
   * Returns 0n when there is no allowance, or when the contract does not
   * implement SEP-41 at all: both mean "nothing to show" to a payer.
   */
  async read(tokenContractId: string, from: string, spender: string): Promise<bigint> {
    const contract = new Contract(tokenContractId);

    // A simulation needs a source account but never a real one — building it
    // locally avoids a network round trip and works for unfunded addresses.
    const source = new Account(from, "0");

    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.network.networkPassphrase,
    })
      .addOperation(
        contract.call(
          "allowance",
          new Address(from).toScVal(),
          new Address(spender).toScVal(),
        ),
      )
      .setTimeout(30)
      .build();

    const simulated = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) return 0n;

    const retval = simulated.result?.retval;
    if (!retval) return 0n;

    const native = scValToNative(retval) as bigint | number | string;
    return BigInt(native);
  }
}
