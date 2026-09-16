import { formatDateRange, formatFileSize } from "@/lib/utils/date";

describe("formatDateRange", () => {
  it("returns empty string for null dates", () => {
    expect(formatDateRange(null, null)).toBe("");
  });

  it("formats single date", () => {
    const d = new Date("2026-09-12");
    const result = formatDateRange(d, null);
    expect(result).toContain("2026");
  });

  it("formats same-month range", () => {
    const start = new Date("2026-09-12");
    const end = new Date("2026-09-16");
    const result = formatDateRange(start, end);
    expect(result).toContain("12");
    expect(result).toContain("16");
  });
});

describe("formatFileSize", () => {
  it("returns — for null", () => {
    expect(formatFileSize(null)).toBe("—");
  });

  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats KB", () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats MB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
