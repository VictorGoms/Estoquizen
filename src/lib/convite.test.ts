import { describe, it, expect } from "vitest";
import { workspaceDoLink } from "./convite";

const WS = "11111111-1111-4111-8111-111111111111";

describe("workspaceDoLink (EQZ-56)", () => {
  it("lê o workspace_id do link do convite", () => {
    expect(workspaceDoLink(`?workspace_id=${WS}`)).toBe(WS);
    expect(workspaceDoLink(`?code=abc&workspace_id=${WS.toUpperCase()}`)).toBe(WS);
  });

  it("ignora o que não é um id de workspace", () => {
    expect(workspaceDoLink("")).toBeNull();
    expect(workspaceDoLink("?workspace_id=")).toBeNull();
    expect(workspaceDoLink("?workspace_id=../../dashboard")).toBeNull();
    expect(workspaceDoLink(`?workspace_id=${WS}x`)).toBeNull();
  });
});
