import { describe, it, expect } from "vitest";
import { generateShortSlug } from "@/lib/slugs";

describe("generateShortSlug", () => {
  it("returns a 6-char URL-safe string", () => {
    const slug = generateShortSlug();
    expect(slug).toMatch(/^[A-Za-z0-9_-]{6}$/);
  });

  it("returns different values across calls", () => {
    const a = generateShortSlug();
    const b = generateShortSlug();
    expect(a).not.toBe(b);
  });
});
