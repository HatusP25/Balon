import { describe, it, expect } from "vitest";
import { FORMATIONS, getFormation, listFormations } from "@/lib/formations";

describe("formations", () => {
  it("lists at least the four core presets and Custom", () => {
    const ids = listFormations().map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["3-3-2", "3-2-3", "4-3-1", "2-3-3", "custom"]));
  });

  it("3-3-2 has 9 slots (1 GK + 3 DF + 3 MF + 2 FW)", () => {
    const f = getFormation("3-3-2");
    expect(f).toBeDefined();
    expect(f!.slots.length).toBe(9);
    const byRole = f!.slots.reduce<Record<string, number>>((acc, s) => {
      acc[s.role] = (acc[s.role] ?? 0) + 1;
      return acc;
    }, {});
    expect(byRole).toEqual({ GK: 1, DF: 3, MF: 3, FW: 2 });
  });

  it("every slot has x and y between 0 and 100", () => {
    for (const f of FORMATIONS.filter((f) => f.id !== "custom")) {
      for (const s of f.slots) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(100);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it("custom formation has no slots", () => {
    const f = getFormation("custom");
    expect(f).toBeDefined();
    expect(f!.slots.length).toBe(0);
  });

  it("getFormation returns undefined for unknown id", () => {
    expect(getFormation("9-9-9")).toBeUndefined();
  });
});
