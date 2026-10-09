# ADR 0002 — Showing `expiration_ledger` as a date

**Status:** accepted
**Date:** 2026-09

## Context

`approve` takes `expiration_ledger`: a ledger sequence number after which the
allowance stops working. It is the right primitive for a contract — ledger
sequence is monotonic and consensus-visible, wall-clock is neither — and it is
useless to a person. Nobody can act on "expires at ledger 58,204,110".

An allowance expiring is not a neutral event either. For a subscription paid
through a standing allowance, expiry means the next charge fails. The payer
wants warning, and warning requires a date.

## Options considered

**Show the raw ledger number.** Honest, unusable. Rejected.

**Project from the average close interval.** Read the current ledger sequence
and its close time, assume ~5s per ledger, multiply out the difference. Simple,
client-side, no extra data source. Error accumulates with distance: a few
minutes over a week, potentially hours over a year.

**Interpolate from historical close times.** Sample ledger close times across a
range and fit the actual rate rather than assuming 5s. More accurate, more
requests, and the improvement is small relative to the error that matters.

## Decision

Project from the current ledger and the network's nominal close interval, and
present the result at a precision that reflects its confidence:

- under 24 hours → "expires in about 7 hours"
- under 30 days → "expires in about 9 days (around 14 Sep)"
- beyond that → "expires around March 2027"

Never render a projected expiry as a precise timestamp. The underlying ledger
number is always available on hover and in the detail view, because that is the
value the contract actually enforces.

## Consequences

A projection is wrong by construction, so the interface must never depend on it
being right. Warnings fire on ledger arithmetic — "fewer than N ledgers
remain" — with the date shown as the human-readable gloss, not the trigger.

The close interval is a network constant with a sensible default per network,
overridable in config so a private or future network with different pacing does
not require a code change.

Anything already expired is stated as fact, not projection: the current ledger
is past the expiration ledger, and that comparison needs no estimate at all.
