import { describe, expect, it } from "vitest";
import { NETWORKS } from "../src/config.js";
import { contractIdFor, tokensFor } from "../src/registry/index.js";
import { candidatesFor } from "../src/discovery.js";

describe("registry", () => {
  it("derives a contract id rather than reading one from the file", () => {
    const [xlm] = tokensFor(NETWORKS.testnet);
    expect(xlm).toBeDefined();
    expect(xlm?.contractId).toMatch(/^C[A-Z2-7]{55}$/);
  });

  it("derives different ids for the same asset on different networks", () => {
    const token = { symbol: "XLM", code: "native", issuer: null, decimals: 7, networks: [] as never[] };
    expect(contractIdFor(token, NETWORKS.testnet.networkPassphrase)).not.toBe(
      contractIdFor(token, NETWORKS.public.networkPassphrase),
    );
  });

  it("only offers tokens declared for that network", () => {
    const symbols = tokensFor(NETWORKS.testnet).map((t) => t.symbol);
    expect(symbols).toContain("XLM");
    expect(symbols).not.toContain("USDC");
  });
});

describe("candidatesFor", () => {
  it("is empty when no spenders are known, rather than inventing any", () => {
    expect(candidatesFor(NETWORKS.testnet)).toHaveLength(0);
  });

  it("pairs every token with every spender", () => {
    const spender = {
      name: "test",
      contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      networks: ["testnet"] as const,
    };
    const candidates = candidatesFor(NETWORKS.testnet, [spender]);
    expect(candidates).toHaveLength(tokensFor(NETWORKS.testnet).length);
    expect(candidates[0]?.spender.name).toBe("test");
  });
});
