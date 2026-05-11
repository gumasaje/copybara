import type { SnippetSummary } from "../types";

export function formatOverviewTimestamp(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date).toLowerCase();
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatOverviewSecondary(snippet: SnippetSummary) {
  const parts = [];

  if (snippet.language?.trim()) {
    parts.push(snippet.language.trim());
  }

  parts.push(snippet.category?.name ?? "No folder");

  return parts.join(" · ");
}
