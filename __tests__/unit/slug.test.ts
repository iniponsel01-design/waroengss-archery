import { generateSlug, generateEventSlug } from "@/lib/utils/slug";

describe("generateSlug", () => {
  it("converts spaces to hyphens", () => {
    expect(generateSlug("Archery National 2026")).toBe("archery-national-2026");
  });

  it("lowercases", () => {
    expect(generateSlug("Archery")).toBe("archery");
  });

  it("removes special characters", () => {
    expect(generateSlug("Archery & More!")).toBe("archery-more");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("a  b")).toBe("a-b");
  });

  it("trims hyphens from edges", () => {
    expect(generateSlug("  archery  ")).toBe("archery");
  });
});

describe("generateEventSlug", () => {
  it("appends year", () => {
    expect(generateEventSlug("Archery National", 2026)).toBe(
      "archery-national-2026"
    );
  });
});
