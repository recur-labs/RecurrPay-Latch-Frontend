# ADR 0001 — Finding allowances without an index

**Status:** accepted, for v0.1
**Date:** 2026-09

## Context

SEP-41 defines `allowance(from, spender) -> i128`. The value lives in the token
contract's storage under a key derived from both addresses. There is no
enumeration: nothing lets you ask a contract "list every spender this account
approved", and nothing lets you ask the network "list every contract this
account has allowances on".

So the central question of this project — *what has this account approved?* —
has no direct answer. Latch has to construct one.

## Options considered

**Scan all Soroban events for `approve`.** Correct in principle, impossible in
practice: public RPC nodes retain events for a short window (on the order of a
day to a week), so anything approved before that window is invisible. An
allowance granted in March with a twelve-month expiry — precisely the dangerous
case — would never appear.

**Run an indexer.** A backend ingesting the full ledger and indexing `approve`
events would answer the question properly. It also means we operate a service,
users trust our data, and a revocation tool acquires a dependency that can go
down or lie. Rejected for v0.1, not rejected forever.

**Ask the user.** "Paste the contract address" works and is honest, but a tool
that requires you to already know what you approved solves nothing on its own.

## Decision

Compose three sources into a candidate list of `(token, spender)` pairs, probe
each with a live `allowance()` simulation, and keep the non-zero ones.

1. **A curated registry** shipped in the repo: the well-known token contracts
   (native XLM SAC, circulating USDC and EURC) and the well-known spenders on
   them. A JSON file, editable by pull request, no gatekeeper.
2. **Recent events**, within whatever window the configured RPC retains —
   catches everything approved lately, which is where an unwanted allowance is
   most likely to have come from.
3. **Manual entry**, for anything the first two miss.

The probe is the source of truth. The registry only decides what gets asked
about; a stale or wrong registry entry produces a zero and disappears. That
keeps a community-editable file from becoming a trust surface.

## Consequences

Latch's answer is "here is what I found among the contracts I checked," never
"here is everything." The UI must say so plainly, and every screen that could
be read as an all-clear needs to name its own limits. Overstating coverage in
a security tool is the worst failure mode available to this project.

Probing is N simulations for N candidates — batched and cached in-session, but
still the cost centre. Keeping the registry small and ordered by likelihood
matters.

Revisit when a public Stellar indexer exposes allowance data, or when RPC event
retention grows enough for a client-side scan to be meaningful. At that point
the registry becomes a fallback rather than the primary source.
