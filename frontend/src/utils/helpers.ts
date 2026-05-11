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
