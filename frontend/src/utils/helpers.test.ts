import { describe, expect, it } from "vitest";
import { parseSidebarMenuKey, parseTags } from "./helpers";

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
