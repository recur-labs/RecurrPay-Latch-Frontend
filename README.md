# Latch

**See and revoke every standing token allowance on your Stellar account.**

When you call `approve(spender, amount, expiration_ledger)` on a SEP-41 token,
you hand a contract standing permission to move your money. That permission
outlives the transaction, the browser tab, and usually your memory of granting
it. Nothing in the Stellar ecosystem shows you the ones you have outstanding.

Latch is that view. Connect a wallet, see every allowance the account has
granted — who can spend, how much is left, when it expires as a date rather
than a ledger number — and revoke any of them in one transaction.

```
approve(spender, 120_0000000, ledger 58_204_110)   ← you did this in March
                                                      and forgot

Latch:  Recur billing engine    98.00 / 120.00 USDC left    expires in 9 days
                                                            [ revoke ]
```

## Why this doesn't exist yet

An allowance is a contract storage entry, not an account flag. It is keyed by
`(from, spender)` inside each token contract, so there is no account-level
index to read: you can ask "what has this account approved for *that* spender
on *this* token", but not "what has this account approved, ever". Wallets show
you balances and trustlines because those hang off the account. Allowances
don't.

Latch works around that rather than pretending the problem away — see
[`docs/adr/0001-discovery.md`](docs/adr/0001-discovery.md).

## Status

**v0.1, pre-alpha, and honest about it.** 22 tests pass on a clean checkout
with no network, wallet or RPC endpoint. Nothing here has been exercised
against a real allowance on a real network yet.

| Area | State |
| --- | --- |
| Architecture and ADRs | written |
| Money as bigint stroops, with tests | working, tested |
| Ledger → date projection, with tests | working, tested |
| Registry with derived contract ids | working, tested |
| Allowance read via simulation | written, **not yet exercised on testnet** |
| Revoke flow through Freighter | written, **not yet exercised on testnet** |
| Recovering the granted amount from events | not started |
| Expiry warnings | partial — needs the expiration ledger, see below |

The gap worth knowing about: `allowance()` returns the remaining amount but not
`expiration_ledger`, so expiry is shown as unknown until the `approve` event is
harvested. That is the top issue in the backlog.

## How it works

Latch is a static site. There is no backend, no database, and no account of
yours that we hold.

1. **Connect** a wallet (Freighter and other SEP-43 wallets) — read-only, no
   signature required to look.
2. **Discover** candidate token contracts: a curated registry, plus any
   contract you paste in, plus contracts seen in recent Soroban events.
3. **Read** `allowance(from = you, spender = candidate)` against each. This is
   a simulation, not a transaction — it costs nothing and submits nothing.
4. **Display** the live remaining amount, the original approval where we can
   recover it, and `expiration_ledger` converted to a wall-clock estimate.
5. **Revoke** by building `approve(spender, 0, 0)` and handing it to your
   wallet to sign. Latch never holds a key.

Everything up to step 5 is read-only. Latch can be run entirely offline of any
service we operate.

## Relationship to Recur

[Recur](https://github.com/recur-labs/recurrpay) is a subscription billing
engine that charges through exactly this mechanism: the payer approves once,
and the engine calls `transfer_from` inside that allowance each period. Recur's
security argument is that the payer can revoke at any time — Latch is where
they actually do it.

Latch is useful without Recur, though. Any Soroban contract you have ever
approved shows up the same way.

## Development

Requires Node 20+ and pnpm 10+.

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test
pnpm typecheck
```

## Contributing

Issues are scoped so that one issue is one pull request. Start with
[CONTRIBUTING.md](CONTRIBUTING.md); the full backlog with complexity tiers is
in [`docs/ISSUE_BACKLOG.md`](docs/ISSUE_BACKLOG.md).

If an issue turns out to be bigger than one pull request once you open it, say
so on the issue and it will be split.

## Licence

MIT — see [LICENSE](LICENSE).
