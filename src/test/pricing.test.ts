import { describe, it, expect } from "vitest";
import { PLANS } from "../site/Pricing";

describe("PLANS data", () => {
  it("has exactly 3 plans", () => {
    expect(PLANS).toHaveLength(3);
  });

  it("Per-Project plan has correct fields", () => {
    const plan = PLANS.find((p) => p.name === "Per-Project");
    expect(plan).toBeDefined();
    expect(plan!.price).toBe(1);
    expect(plan!.feats.length).toBeGreaterThan(0);
  });

  it("Basic plan has correct fields", () => {
    const plan = PLANS.find((p) => p.name === "Basic");
    expect(plan).toBeDefined();
    expect(plan!.price).toBe(349);
  });

  it("Industrial Pro plan has correct fields", () => {
    const plan = PLANS.find((p) => p.name === "Industrial Pro");
    expect(plan).toBeDefined();
    expect(plan!.price).toBe(499);
    expect(plan!.tag).toBe("MOST SECURE");
  });

  it("all plans have name, price, and at least one feature", () => {
    PLANS.forEach((p) => {
      expect(p.name).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(p.feats.length).toBeGreaterThan(0);
    });
  });

  it("plans are sorted ascending by price", () => {
    const prices = PLANS.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
