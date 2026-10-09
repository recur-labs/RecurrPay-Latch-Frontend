# Issue backlog

Each issue is scoped to one pull request. Complexity maps onto the tiers a Wave
program uses: Trivial (100 points), Medium (150), High (200).

**Tag only what you can review inside a cycle.** For a first wave that means
roughly eight to twelve issues, weighted toward the good-first-issues — not
this whole file. The rest is a roadmap, not a menu.

Ordering below is roughly dependency order: the foundations near the top unblock
most of what follows.

## Foundations

| Complexity | Issue | Labels |
| --- | --- | --- |
| Medium | Add eslint with a rule banning float arithmetic on amounts | tooling, good first issue |
| Medium | Code-split the bundle: the SDK alone is over 500 kB | perf, good first issue |
| Trivial | Let the RPC endpoint be overridden without editing config.ts | setup, good first issue |

Scaffold, network config and the money module are done — see the commit log.

## Wallet

| Complexity | Issue | Labels |
| --- | --- | --- |
| High | Wallet connection through the SEP-43 interface, with Freighter first | wallet |
| Medium | Handle wallet account switching and network mismatch | wallet |
| Trivial | Show the connected address truncated, with copy-to-clipboard | ui, good first issue |
| Medium | Read-only mode: inspect any address typed in, without connecting | wallet, ui |

## Discovery and reading

| Complexity | Issue | Labels |
| --- | --- | --- |
| Medium | Ship the curated token/spender registry as an editable JSON file | discovery, good first issue |
| High | Probe candidates with batched `allowance()` simulations | discovery, core |
| High | Harvest `approve` events from RPC to recover expiry and granted amount | discovery, milestone:v0.2 |
| Medium | Manual entry: check a pasted token contract and spender | discovery, ui |
| Medium | Recover the originally granted amount from the `approve` event | discovery |
| Medium | Cache probe results per session, with explicit refresh | discovery, perf |

## Expiry

| Complexity | Issue | Labels |
| --- | --- | --- |
| Medium | Convert `expiration_ledger` to a projected date (ADR 0002) | expiry, core |
| Trivial | Render already-expired allowances as expired, not as a projection | expiry, good first issue |
| Medium | Warn when an allowance expires within a configurable ledger window | expiry, ui |
| Trivial | Make the close-interval constant configurable per network | expiry, good first issue |

## Revocation

| Complexity | Issue | Labels |
| --- | --- | --- |
| High | Build and submit `approve(spender, 0, 0)` through the wallet | revoke, core |
| Medium | Confirm revocation by re-reading the allowance, not by assuming success | revoke, correctness |
| Medium | Handle a revoke that fails, times out, or is rejected in the wallet | revoke, correctness |
| Medium | Revoke several allowances in one flow without re-prompting per item | revoke, ui |

## Interface

| Complexity | Issue | Labels |
| --- | --- | --- |
| Medium | Allowance list: spender, remaining, granted, expiry, action | ui |
| Medium | Empty state that says what was checked, not "you have none" | ui, correctness |
| Trivial | Loading and error states for a failing RPC endpoint | ui, good first issue |
| Medium | Dark and light themes driven by system preference | ui, good first issue |
| Medium | Responsive layout down to phone width | ui |
| Trivial | Link each spender contract to a block explorer | ui, good first issue |

## Documentation

| Complexity | Issue | Labels |
| --- | --- | --- |
| Medium | Write docs/quickstart.md: connect, inspect, revoke | docs |
| Trivial | Document how to add a token to the registry | docs, good first issue |
| Medium | Write a short explainer on what a SEP-41 allowance actually is | docs |

## Testing

| Complexity | Issue | Labels |
| --- | --- | --- |
| High | Fixture-based tests for the discovery pipeline against recorded RPC responses | testing |
| Medium | Property tests for stroop parsing and formatting | testing, good first issue |
| Medium | Ledger-projection tests with a fake clock and fake ledger | testing |
| Trivial | Add coverage reporting with a floor | testing, good first issue |
