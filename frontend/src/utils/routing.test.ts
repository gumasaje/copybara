import { describe, expect, it } from "vitest";
import { buildWorkspaceHash, parseWorkspaceHash } from "./routing";

describe("workspace hash routing", () => {
  it("parses snippet detail routes with scope", () => {
    expect(parseWorkspaceHash("#/snippets/42?scope=folder-7")).toEqual({
      overviewMode: null,
      selectedSidebarScope: "folder-7",
      selectedSnippetId: 42,
      keyword: ""
    });
  });

  it("parses trash overview and trash detail routes", () => {
    expect(parseWorkspaceHash("#/trash")).toMatchObject({
      overviewMode: "trash",
      selectedSidebarScope: "trash",
      selectedSnippetId: null
    });
    expect(parseWorkspaceHash("#/trash/9")).toMatchObject({
      overviewMode: null,
      selectedSidebarScope: "trash",
      selectedSnippetId: 9
    });
  });

  it("parses keyword searches with scoped filters", () => {
    expect(parseWorkspaceHash("#/search?q=jwt&scope=tag-Spring%20Security&snippet=3")).toEqual({
      overviewMode: null,
      selectedSidebarScope: "tag-Spring%20Security",
      selectedSnippetId: 3,
      keyword: "jwt"
    });
  });

  it("builds stable hashes for search, overview, and detail states", () => {
    expect(buildWorkspaceHash({ overviewMode: null, selectedSidebarScope: "folder-7", selectedSnippetId: 42, keyword: "" })).toBe(
      "#/snippets/42?scope=folder-7"
    );
    expect(buildWorkspaceHash({ overviewMode: "all", selectedSidebarScope: null, selectedSnippetId: null, keyword: "" })).toBe("#/all");
    expect(buildWorkspaceHash({ overviewMode: null, selectedSidebarScope: "search", selectedSnippetId: 3, keyword: " jwt " })).toBe(
      "#/search?q=jwt&snippet=3"
    );
  });
});
