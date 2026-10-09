# ADR 0003 — No backend, no custody, no analytics

**Status:** accepted
**Date:** 2026-09

## Context

Latch exists so that someone can withdraw permission they granted to a contract
they no longer trust. A tool for that purpose is judged partly on what it
builds and mostly on what it asks you to trust.

There are real reasons to want a server: the discovery problem in ADR 0001
would be solved outright by an indexer; expiry warnings would be far more
useful delivered by email than by being noticed in a tab; usage data would tell
us which parts of this are working.

## Decision

v0.1 ships as a static bundle with no backend of ours in any path.

- **No key handling.** Transactions are built unsigned and passed to the
  wallet. There is no signing code, so there is no signing bug.
- **No account data leaves the browser** except to the Soroban RPC endpoint the
  user has configured, which is swappable and defaults to a public node.
- **No analytics, no error reporting, no fonts or scripts from third-party
  hosts.** A wallet address in a request URL is a privacy leak whatever the
  recipient's intentions.
- **Deployable by anyone.** `pnpm build` produces files that can be served from
  anywhere, including locally. Nothing about a self-hosted copy is degraded.

## Consequences

Discovery stays partial, per ADR 0001. Warnings only work while the page is
open — no push, no email. Some genuinely useful features are off the table
until this decision is revisited, and that is the trade being made deliberately
rather than by omission.

If a backend is ever added it must be optional, self-hostable, and additive:
Latch without it still has to do everything it does today. A version that stops
working when our server is down has broken the promise this ADR exists to keep.

The upside is that the security story fits in a paragraph a user can verify by
reading the network tab, and that the whole thing survives us losing interest
in hosting it.
