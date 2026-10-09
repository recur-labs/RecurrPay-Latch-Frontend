# Contributing

## Setup

Node 20+ and pnpm 10+.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test
pnpm typecheck
```

`pnpm test` requires no network, no wallet and no RPC endpoint. If a test you
are writing needs one of those, it needs a fixture instead — see below.

## Picking something up

Issues are scoped so that one issue is one pull request. Comment on the issue
before starting so two people don't do the same work. If it turns out to be
bigger than one pull request once you're inside it, say so on the issue rather
than opening a large one — it will be split.

Issues labelled `good first issue` are self-contained and don't require
understanding the discovery pipeline.

## What a reviewable pull request looks like here

- **One issue's worth of change.** A drive-by fix to something unrelated makes
  a PR harder to review, not more valuable — open a second one.
- **Tests for logic, fixtures for the network.** Anything that talks to RPC is
  tested against recorded responses in `test/fixtures`, so the suite stays
  fast and offline. Record a new fixture rather than mocking by hand where you
  can.
- **Amounts stay `bigint`.** Stroops all the way through; formatting happens
  once, at render. A PR that introduces float arithmetic on an amount will be
  asked to change regardless of how well it works.
- **Honest empty and error states.** If your change can produce "nothing
  found", it has to distinguish that from "nothing exists". This is the one
  review rule that gets applied strictly — see ARCHITECTURE.md.
- **Commit messages that say why.** The diff already says what.

## Security

Latch never signs. If your change introduces code that handles a secret key,
constructs a signature, or sends an account address anywhere other than the
configured RPC endpoint, it will be rejected — see
[`docs/adr/0003-no-backend.md`](docs/adr/0003-no-backend.md).

Report anything you believe is a vulnerability privately through the repository
security advisory form rather than in a public issue.

## Adding a token to the registry

The registry in `src/registry/tokens.json` decides which contracts get probed.
It is not a trust list — a wrong entry produces a zero allowance and vanishes
from the UI — so additions are low-risk and welcome. Include the contract id,
network, symbol, and a link to something that corroborates it.
