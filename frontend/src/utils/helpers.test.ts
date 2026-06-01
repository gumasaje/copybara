import { describe, expect, it } from "vitest";
import {
  buildCategoryReorder,
  buildSnippetListFilter,
  parseSidebarMenuKey,
  parseSnippetFilterScope,
  parseTags,
  resolveSnippetFocusScope
} from "./helpers";
import type { SnippetSummary } from "../types";

describe("parseTags", () => {
  it("splits comma-separated tags and trims whitespace", () => {
    expect(parseTags(" Java,  Spring Boot, , JPA  ")).toEqual(["Java", "Spring Boot", "JPA"]);
  });

  it("returns an empty array when tags are blank", () => {
    expect(parseTags(" ,   , ")).toEqual([]);
  });
});

describe("parseSidebarMenuKey", () => {
  it("parses folder scope keys with the last colon", () => {
    expect(parseSidebarMenuKey("folder-12:34")).toEqual({ scope: "folder-12", snippetId: 34 });
  });

  it("supports non-folder scopes", () => {
    expect(parseSidebarMenuKey("favorites:7")).toEqual({ scope: "favorites", snippetId: 7 });
  });
});

describe("parseSnippetFilterScope", () => {
  it("extracts category filters from folder scopes", () => {
    expect(parseSnippetFilterScope("folder-12")).toEqual({ categoryId: 12 });
  });

  it("extracts decoded tag filters from tag scopes", () => {
    expect(parseSnippetFilterScope("tag-Spring%20Security")).toEqual({ tag: "Spring Security" });
  });

  it("returns null for non-server-backed scopes", () => {
    expect(parseSnippetFilterScope("favorites")).toBeNull();
  });
});

describe("buildSnippetListFilter", () => {
  it("uses normal list loading for empty searches", () => {
    expect(buildSnippetListFilter("   ", "folder-12")).toEqual({});
  });

  it("combines keyword searches with folder scope", () => {
    expect(buildSnippetListFilter(" jwt ", "folder-12")).toEqual({ keyword: "jwt", categoryId: 12 });
  });

  it("combines keyword searches with tag scope", () => {
    expect(buildSnippetListFilter("jwt", "tag-Spring%20Security")).toEqual({ keyword: "jwt", tag: "Spring Security" });
  });

  it("does not add client-only scopes to keyword searches", () => {
    expect(buildSnippetListFilter("jwt", "trash")).toEqual({ keyword: "jwt" });
  });
});

describe("buildCategoryReorder", () => {
  it("moves a category before the requested target slot", () => {
    expect(buildCategoryReorder([1, 2, 3], 3, 0)).toEqual([3, 1, 2]);
  });

  it("moves a category after later target slots with index adjustment", () => {
    expect(buildCategoryReorder([1, 2, 3], 1, 3)).toEqual([2, 3, 1]);
  });

  it("returns null for no-op drops", () => {
    expect(buildCategoryReorder([1, 2, 3], 2, 2)).toBeNull();
  });

  it("returns null for unknown dragging categories or invalid target slots", () => {
    expect(buildCategoryReorder([1, 2, 3], 9, 1)).toBeNull();
    expect(buildCategoryReorder([1, 2, 3], 2, -1)).toBeNull();
    expect(buildCategoryReorder([1, 2, 3], 2, 4)).toBeNull();
  });
});

describe("resolveSnippetFocusScope", () => {
  const snippet: SnippetSummary = {
    snippetId: 1,
    title: "Scope target",
    language: "Java",
    category: null,
    favorite: false,
    tags: [],
    createdAt: "2026-05-10T09:00:00.000Z",
    updatedAt: "2026-05-10T09:00:00.000Z",
    deletedAt: null
  };

  it("focuses deleted snippets in trash", () => {
    expect(resolveSnippetFocusScope({ ...snippet, deletedAt: "2026-05-12T09:00:00.000Z", favorite: true })).toBe("trash");
  });

  it("focuses moved snippets in their folder", () => {
    expect(resolveSnippetFocusScope({ ...snippet, category: { categoryId: 12, name: "Backend" }, favorite: true })).toBe("folder-12");
  });

  it("focuses uncategorized favorites in pinned scope", () => {
    expect(resolveSnippetFocusScope({ ...snippet, favorite: true })).toBe("favorites");
  });

  it("focuses unpinned uncategorized snippets in inbox", () => {
    expect(resolveSnippetFocusScope(snippet)).toBe("inbox");
  });
});
