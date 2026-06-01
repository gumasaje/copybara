import type { SnippetDetail, SnippetSummary } from "../types";

export function parseTags(tagsText: string) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseSidebarMenuKey(menuKey: string) {
  const separatorIndex = menuKey.lastIndexOf(":");
  const scope = menuKey.slice(0, separatorIndex);
  const snippetId = Number(menuKey.slice(separatorIndex + 1));
  return { scope, snippetId };
}

export function parseSnippetFilterScope(scope: string | null) {
  if (scope?.startsWith("folder-")) {
    return { categoryId: Number(scope.replace("folder-", "")) };
  }
  if (scope?.startsWith("tag-")) {
    return { tag: decodeURIComponent(scope.replace("tag-", "")) };
  }
  return null;
}

export function buildSnippetListFilter(keyword: string, scope: string | null) {
  const trimmedKeyword = keyword.trim();
  const scopeFilter = parseSnippetFilterScope(scope);

  if (trimmedKeyword.length === 0) {
    return {};
  }

  return {
    ...scopeFilter,
    keyword: trimmedKeyword
  };
}

export function buildCategoryReorder(
  orderedCategoryIds: number[],
  draggingCategoryId: number,
  targetIndex: number
) {
  const fromIndex = orderedCategoryIds.indexOf(draggingCategoryId);

  if (fromIndex < 0 || targetIndex < 0 || targetIndex > orderedCategoryIds.length) {
    return null;
  }

  const nextOrder = [...orderedCategoryIds];
  const [movedCategoryId] = nextOrder.splice(fromIndex, 1);
  const adjustedTargetIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
  nextOrder.splice(adjustedTargetIndex, 0, movedCategoryId);

  if (orderedCategoryIds.every((categoryId, index) => categoryId === nextOrder[index])) {
    return null;
  }

  return nextOrder;
}

export function resolveSnippetFocusScope(snippet: SnippetDetail | SnippetSummary) {
  if (snippet.deletedAt != null) {
    return "trash";
  }
  if (snippet.category?.categoryId != null) {
    return `folder-${snippet.category.categoryId}`;
  }
  if (snippet.favorite) {
    return "favorites";
  }
  return "inbox";
}
