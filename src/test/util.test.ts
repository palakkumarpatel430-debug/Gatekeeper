import { describe, it, expect, vi } from "vitest";
import { uid, today, fmt, money, esc, sha } from "../lib/util";

describe("uid", () => {
  it("returns a non-empty string", () => {
    expect(uid()).toBeTruthy();
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, uid));
    expect(ids.size).toBe(100);
  });
});

describe("today", () => {
  it("returns ISO date string YYYY-MM-DD", () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the current date", () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(today()).toBe(expected);
  });
});

describe("fmt", () => {
  it("formats a number with locale separators", () => {
    expect(fmt(1000)).toBe("1,000");
  });

  it("handles zero", () => {
    expect(fmt(0)).toBe("0");
  });

  it("handles string input coercion", () => {
    expect(fmt(1234567)).toBe("1,234,567");
  });
});

describe("money", () => {
  it("formats with dollar sign and 2 decimals", () => {
    expect(money(99)).toBe("$99.00");
  });

  it("formats cents correctly", () => {
    expect(money(1.5)).toBe("$1.50");
  });

  it("formats zero", () => {
    expect(money(0)).toBe("$0.00");
  });

  it("formats large amounts", () => {
    expect(money(1000)).toBe("$1,000.00");
  });
});

describe("esc", () => {
  it("escapes & character", () => {
    expect(esc("a&b")).toBe("a&amp;b");
  });

  it("escapes < character", () => {
    expect(esc("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes > character", () => {
    expect(esc("a>b")).toBe("a&gt;b");
  });

  it("escapes double quote", () => {
    expect(esc('"hello"')).toBe("&quot;hello&quot;");
  });

  it("leaves safe strings unchanged", () => {
    expect(esc("hello world")).toBe("hello world");
  });

  it("handles null", () => {
    expect(esc(null)).toBe("");
  });

  it("handles undefined", () => {
    expect(esc(undefined)).toBe("");
  });

  it("handles numbers", () => {
    expect(esc(42)).toBe("42");
  });
});

describe("sha", () => {
  it("returns a hex string for a given input", async () => {
    const hash = await sha("password123");
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("same input produces same hash", async () => {
    const a = await sha("test");
    const b = await sha("test");
    expect(a).toBe(b);
  });

  it("different inputs produce different hashes", async () => {
    const a = await sha("abc");
    const b = await sha("xyz");
    expect(a).not.toBe(b);
  });

  it("returns non-empty string", async () => {
    const h = await sha("anything");
    expect(h.length).toBeGreaterThan(0);
  });
});
