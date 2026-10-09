# Security policy

Latch never handles a secret key. Transactions are built unsigned and passed to
the user's wallet; there is no signing code in this repository. If you find
code that violates that, treat it as a vulnerability.

Also in scope:

- an account address sent anywhere other than the configured RPC endpoint
- any UI state that presents "no allowances found" as "no allowances exist"
- an allowance shown as revoked without a confirming re-read
- a dependency that loads code or assets from a third-party host at runtime

Please report privately through this repository's security advisory form rather
than opening a public issue. Expect an acknowledgement within a few days.

Latch is pre-alpha and has not been audited. Do not rely on it as your only
check before trusting a contract with an allowance.
