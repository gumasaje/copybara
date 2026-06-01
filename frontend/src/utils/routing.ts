export type WorkspaceRouteState = {
  overviewMode: "all" | "trash" | "search" | null;
  selectedSidebarScope: string | null;
  selectedSnippetId: number | null;
  keyword: string;
};

export function parseWorkspaceHash(hash: string): WorkspaceRouteState {
  const route = normalizeHash(hash);
  const [pathname, search = ""] = route.split("?");
  const params = new URLSearchParams(search);
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "all") {
    return emptyRoute({ overviewMode: "all" });
  }

  if (parts[0] === "trash") {
    const snippetId = parseNumericId(parts[1]);
    return emptyRoute({
      overviewMode: snippetId == null ? "trash" : null,
      selectedSidebarScope: "trash",
      selectedSnippetId: snippetId
    });
  }

  if (parts[0] === "search") {
    return emptyRoute({
      selectedSidebarScope: normalizeSidebarScope(params.get("scope")) || "search",
      selectedSnippetId: parseNumericId(params.get("snippet")),
      keyword: params.get("q") ?? ""
    });
  }

  if (parts[0] === "snippets") {
    return emptyRoute({
      selectedSidebarScope: normalizeSidebarScope(params.get("scope")),
      selectedSnippetId: parseNumericId(parts[1])
    });
  }

  if (parts[0] === "inbox" || parts[0] === "favorites" || parts[0] === "recents") {
    return emptyRoute({ selectedSidebarScope: parts[0] });
  }

  if (parts[0] === "folders") {
    const categoryId = parseNumericId(parts[1]);
    return emptyRoute({
      selectedSidebarScope: categoryId == null ? null : `folder-${categoryId}`,
      selectedSnippetId: parseNumericId(params.get("snippet"))
    });
  }

  if (parts[0] === "tags" && parts[1]) {
    return emptyRoute({
      selectedSidebarScope: `tag-${encodeURIComponent(decodeURIComponent(parts[1]))}`,
      selectedSnippetId: parseNumericId(params.get("snippet"))
    });
  }

  return emptyRoute();
}

export function buildWorkspaceHash(state: WorkspaceRouteState) {
  const keyword = state.keyword.trim();

  if (keyword.length > 0) {
    const params = new URLSearchParams({ q: keyword });
    if (state.selectedSidebarScope && state.selectedSidebarScope !== "search") {
      params.set("scope", state.selectedSidebarScope);
    }
    if (state.selectedSnippetId != null) {
      params.set("snippet", String(state.selectedSnippetId));
    }
    return `#/search?${params.toString()}`;
  }

  if (state.overviewMode === "all") {
    return "#/all";
  }

  if (state.overviewMode === "trash") {
    return "#/trash";
  }

  if (state.selectedSidebarScope === "trash") {
    return state.selectedSnippetId == null ? "#/trash" : `#/trash/${state.selectedSnippetId}`;
  }

  if (state.selectedSnippetId != null) {
    const params = new URLSearchParams();
    if (state.selectedSidebarScope != null) {
      params.set("scope", state.selectedSidebarScope);
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return `#/snippets/${state.selectedSnippetId}${suffix}`;
  }

  if (state.selectedSidebarScope === "inbox" || state.selectedSidebarScope === "favorites" || state.selectedSidebarScope === "recents") {
    return `#/${state.selectedSidebarScope}`;
  }

  if (state.selectedSidebarScope?.startsWith("folder-")) {
    return `#/folders/${state.selectedSidebarScope.replace("folder-", "")}`;
  }

  if (state.selectedSidebarScope?.startsWith("tag-")) {
    return `#/tags/${state.selectedSidebarScope.replace("tag-", "")}`;
  }

  return "#/";
}

function emptyRoute(overrides: Partial<WorkspaceRouteState> = {}): WorkspaceRouteState {
  return {
    overviewMode: null,
    selectedSidebarScope: null,
    selectedSnippetId: null,
    keyword: "",
    ...overrides
  };
}

function normalizeHash(hash: string) {
  const normalized = hash.replace(/^#/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function parseNumericId(value: string | null | undefined) {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null;
}

function normalizeSidebarScope(scope: string | null) {
  if (scope?.startsWith("tag-")) {
    return `tag-${encodeURIComponent(decodeURIComponent(scope.replace("tag-", "")))}`;
  }
  return scope;
}
