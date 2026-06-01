import { describe, expect, it } from "vitest";
import { buildSnippetListFilter, parseSidebarMenuKey, parseSnippetFilterScope, parseTags } from "./helpers";

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
