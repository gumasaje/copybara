import { describe, expect, it, vi } from "vitest";
import { formatOverviewSecondary, formatOverviewTimestamp } from "./formatters";
import type { SnippetSummary } from "../types";

const BASE_SNIPPET: SnippetSummary = {
  snippetId: 1,
  title: "Test snippet",
  language: "TypeScript",
  category: { categoryId: 3, name: "Frontend" },
  favorite: false,
  tags: [],
  createdAt: "2026-05-10T09:00:00.000Z",
  updatedAt: "2026-05-10T09:00:00.000Z",
  deletedAt: null
};

describe("formatOverviewSecondary", () => {
  it("formats language and folder name", () => {
    expect(formatOverviewSecondary(BASE_SNIPPET)).toBe("TypeScript · Frontend");
  });

  it("falls back to No folder when category is missing", () => {
    expect(formatOverviewSecondary({ ...BASE_SNIPPET, category: null, language: "  " })).toBe("No folder");
  });
});

describe("formatOverviewTimestamp", () => {
  it("shows time for snippets updated on the same day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T08:30:00.000Z"));
    expect(formatOverviewTimestamp("2026-05-12T05:15:00.000Z")).toContain(":");
    vi.useRealTimers();
  });

  it("shows month and day for older snippets", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T08:30:00.000Z"));
    expect(formatOverviewTimestamp("2026-05-10T05:15:00.000Z")).toMatch(/[A-Z][a-z]{2} \d{1,2}/);
    vi.useRealTimers();
  });
});
