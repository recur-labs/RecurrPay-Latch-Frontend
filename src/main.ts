import { DEFAULT_NETWORK, NETWORKS, isNetworkId, type NetworkConfig } from "./config.js";
import { scan, type FoundAllowance, type ScanResult } from "./discovery.js";
import type { SpenderEntry } from "./registry/index.js";
import { revoke } from "./revoke.js";
import { detectWallet, type Wallet } from "./wallet.js";
import { renderAllowance, renderCoverageNote, renderEmptyState, truncate } from "./ui.js";

interface State {
  network: NetworkConfig;
  account: string | null;
  wallet: Wallet | null;
  extraSpenders: SpenderEntry[];
  result: ScanResult | null;
  status: string;
  busy: boolean;
}

const state: State = {
  network: NETWORKS[DEFAULT_NETWORK],
  account: null,
  wallet: detectWallet(),
  extraSpenders: [],
  result: null,
  status: "",
  busy: false,
};

const app = document.querySelector<HTMLDivElement>("#app");
if (app) render(app);

function render(root: HTMLElement): void {
  root.replaceChildren();

  const header = document.createElement("header");
  const h1 = document.createElement("h1");
  h1.textContent = "Latch";
  const tagline = document.createElement("p");
  tagline.textContent =
    "See and revoke every standing token allowance on your Stellar account.";
  header.append(h1, tagline);
  root.append(header);

  root.append(controls(root));

  if (state.status) {
    const status = document.createElement("p");
    status.className = "note";
    status.textContent = state.status;
    root.append(status);
  }

  const result = state.result;
  if (result) {
    if (result.allowances.length === 0) {
      root.append(renderEmptyState(result));
    } else {
      for (const allowance of result.allowances) {
        root.append(
          renderAllowance(allowance, result, state.network, (a) => onRevoke(root, a)),
        );
      }
      root.append(renderCoverageNote(result));
    }
  }

  const footer = document.createElement("footer");
  footer.textContent =
    "Latch never holds a key. Reads are simulations; revocation is signed by your wallet.";
  root.append(footer);
}

function controls(root: HTMLElement): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "controls";

  const networkSelect = document.createElement("select");
  for (const config of Object.values(NETWORKS)) {
    const option = document.createElement("option");
    option.value = config.id;
    option.textContent = config.label;
    option.selected = config.id === state.network.id;
    networkSelect.append(option);
  }
  networkSelect.addEventListener("change", () => {
    if (isNetworkId(networkSelect.value)) {
      state.network = NETWORKS[networkSelect.value];
      state.result = null;
      state.status = "";
      render(root);
    }
  });

  const address = document.createElement("input");
  address.placeholder = "G… account address";
  address.value = state.account ?? "";
  address.spellcheck = false;
  address.addEventListener("input", () => {
    state.account = address.value.trim() || null;
  });

  const connect = document.createElement("button");
  connect.textContent = state.wallet ? `Connect ${state.wallet.name}` : "No wallet detected";
  connect.disabled = state.wallet === null || state.busy;
  connect.addEventListener("click", () => onConnect(root));

  const check = document.createElement("button");
  check.className = "primary";
  check.textContent = state.busy ? "Checking…" : "Check allowances";
  check.disabled = state.busy;
  check.addEventListener("click", () => onScan(root));

  const spender = document.createElement("input");
  spender.placeholder = "C… spender contract to check (optional)";
  spender.spellcheck = false;

  const addSpender = document.createElement("button");
  addSpender.textContent = "Add spender";
  addSpender.addEventListener("click", () => {
    const value = spender.value.trim();
    if (!value) return;
    state.extraSpenders.push({
      name: truncate(value, 6),
      contractId: value,
      networks: [state.network.id],
    });
    spender.value = "";
    state.status = `Added ${truncate(value, 6)} to the contracts Latch will probe.`;
    render(root);
  });

  wrap.append(networkSelect, address, connect, check, spender, addSpender);
  return wrap;
}

async function onConnect(root: HTMLElement): Promise<void> {
  if (!state.wallet) return;
  try {
    state.account = await state.wallet.connect();
    state.status = `Connected ${truncate(state.account)}.`;
  } catch (error) {
    state.status = describe(error);
  }
  render(root);
}

async function onScan(root: HTMLElement): Promise<void> {
  if (!state.account) {
    state.status = "Enter an account address, or connect a wallet.";
    render(root);
    return;
  }

  state.busy = true;
  state.status = "Reading allowances…";
  render(root);

  try {
    state.result = await scan(state.network, state.account, state.extraSpenders);
    state.status = "";
  } catch (error) {
    state.result = null;
    state.status = describe(error);
  } finally {
    state.busy = false;
    render(root);
  }
}

async function onRevoke(root: HTMLElement, allowance: FoundAllowance): Promise<void> {
  if (!state.wallet || !state.account) {
    state.status = "Revoking needs a connected wallet — Latch cannot sign for you.";
    render(root);
    return;
  }

  state.busy = true;
  state.status = `Revoking ${allowance.spender.name}… confirm in your wallet.`;
  render(root);

  const outcome = await revoke(state.network, state.wallet, {
    tokenContractId: allowance.token.contractId,
    from: state.account,
    spender: allowance.spender.contractId,
  });

  state.busy = false;
  state.status = outcome.ok
    ? outcome.confirmedZero
      ? `Revoked. Confirmed zero on a re-read (${truncate(outcome.txHash, 6)}).`
      : `Submitted (${truncate(outcome.txHash, 6)}), but the allowance did not read back as zero. Re-check before assuming it is gone.`
    : `Revoke failed: ${outcome.reason}`;

  if (outcome.ok) await onScan(root);
  else render(root);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
