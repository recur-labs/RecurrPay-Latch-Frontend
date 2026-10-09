import { EXPIRY_WARNING_LEDGERS, type NetworkConfig } from "./config.js";
import type { FoundAllowance, ScanResult } from "./discovery.js";
import { projectExpiry } from "./ledger-time.js";
import { formatStroops } from "./money.js";

export function truncate(address: string, keep = 5): string {
  return address.length <= keep * 2 + 3
    ? address
    : `${address.slice(0, keep)}…${address.slice(-keep)}`;
}

export function renderAllowance(
  allowance: FoundAllowance,
  result: ScanResult,
  network: NetworkConfig,
  onRevoke: (allowance: FoundAllowance) => void,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "allowance";

  const left = document.createElement("div");

  const who = document.createElement("div");
  who.className = "who";
  who.textContent = allowance.spender.name || truncate(allowance.spender.contractId);
  left.append(who);

  const amount = document.createElement("div");
  amount.className = "amount";
  amount.textContent = `${formatStroops(allowance.remaining, allowance.token.decimals)} ${allowance.token.symbol} can still be spent`;
  left.append(amount);

  const detail = document.createElement("div");
  detail.className = "detail";

  if (allowance.expirationLedger === null) {
    detail.textContent = "expiry unknown — not recoverable from recent events";
  } else {
    const expiry = projectExpiry({
      expirationLedger: allowance.expirationLedger,
      currentLedger: result.currentLedger,
      closeIntervalSeconds: network.closeIntervalSeconds,
      now: new Date(),
    });
    detail.textContent = expiry.label;
    detail.title = `expiration ledger ${allowance.expirationLedger}`;
    if (expiry.expired || expiry.ledgersRemaining < EXPIRY_WARNING_LEDGERS) {
      row.classList.add("warn");
    }
  }
  left.append(detail);

  const contract = document.createElement("a");
  contract.className = "mono detail";
  contract.href = `${network.explorerBase}/contract/${allowance.spender.contractId}`;
  contract.target = "_blank";
  contract.rel = "noreferrer noopener";
  contract.textContent = truncate(allowance.spender.contractId, 8);
  left.append(document.createElement("br"), contract);

  const button = document.createElement("button");
  button.className = "primary";
  button.textContent = "Revoke";
  button.addEventListener("click", () => onRevoke(allowance));

  row.append(left, button);
  return row;
}

/**
 * The empty state says what was checked. It must never read as "you have no
 * allowances" — Latch cannot know that. See ARCHITECTURE.md.
 */
export function renderEmptyState(result: ScanResult): HTMLElement {
  const note = document.createElement("p");
  note.className = "note";
  note.textContent =
    result.checked === 0
      ? "Nothing was checked: no spender contracts are configured for this network yet. " +
        "Add one above to probe it."
      : `No allowances found among the ${result.checked} contract pair${result.checked === 1 ? "" : "s"} checked. ` +
        "This is not proof that none exist — allowances cannot be enumerated on Stellar, " +
        "so Latch only sees what it knows to ask about.";
  return note;
}

export function renderCoverageNote(result: ScanResult): HTMLElement {
  const note = document.createElement("p");
  note.className = "note";
  note.textContent =
    `Checked ${result.checked} token/spender pair${result.checked === 1 ? "" : "s"} at ledger ${result.currentLedger}. ` +
    "Allowances Latch was not told to look for will not appear here.";
  return note;
}
