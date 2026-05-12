import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSidebarInteractions } from "./useSidebarInteractions";
import type { Category, SnippetSummary } from "../types";

const category: Category = {
  categoryId: 10,
  name: "Algorithms",
  sortOrder: 1,
  snippetCount: 1,
  createdAt: "2026-05-10T09:00:00.000Z",
  updatedAt: "2026-05-10T09:00:00.000Z"
};

const folderSnippet: SnippetSummary = {
  snippetId: 5,
  title: "DFS",
  language: "Java",
  category: { categoryId: 10, name: "Algorithms" },
  favorite: false,
  tags: [],
  createdAt: "2026-05-10T09:00:00.000Z",
  updatedAt: "2026-05-10T09:00:00.000Z",
  deletedAt: null
};

describe("useSidebarInteractions", () => {
  it("toggles expanded categories", () => {
    const { result } = renderHook(() =>
      useSidebarInteractions({
        categories: [category],
        allSnippets: [folderSnippet],
        favoriteSnippets: [],
        recentSnippets: [],
        uncategorizedSnippets: [],
        selectedSnippetId: null,
        keyword: ""
      })
    );

    act(() => result.current.toggleCategory(10));
    expect(result.current.expandedCategories.has(10)).toBe(true);

    act(() => result.current.toggleCategory(10));
    expect(result.current.expandedCategories.has(10)).toBe(false);
  });

  it("resolves active sidebar menu targets by scope", () => {
    const { result } = renderHook(() =>
      useSidebarInteractions({
        categories: [category],
        allSnippets: [folderSnippet],
        favoriteSnippets: [],
        recentSnippets: [],
        uncategorizedSnippets: [],
        selectedSnippetId: null,
        keyword: ""
      })
    );

    act(() => {
      result.current.setOpenSidebarSnippetMenuId("folder-10:5");
    });

    expect(result.current.activeSidebarMenuTarget).toEqual({
      scope: "folder-10",
      snippet: folderSnippet
    });
  });
});
