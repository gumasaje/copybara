import { FolderOpen, Pin, Trash2 } from "lucide-react";
import type { SearchOverviewState, SnippetSummary } from "../types";
import { formatOverviewSecondary, formatOverviewTimestamp } from "../utils/formatters";

type OverviewListViewProps = {
  mode: "all" | "trash" | "search";
  allSnippets: SnippetSummary[];
  trashSnippets: SnippetSummary[];
  searchOverview: SearchOverviewState | null;
  onSelectSnippet: (snippetId: number, scope: string | null) => void;
  onRestoreSnippet: (snippetId: number) => Promise<void> | void;
  onDeleteSnippet: (snippet: SnippetSummary) => void;
  onToggleFavorite: (snippet: SnippetSummary) => Promise<void> | void;
};

export function OverviewListView({
  mode,
  allSnippets,
  trashSnippets,
  searchOverview,
  onSelectSnippet,
  onRestoreSnippet,
  onDeleteSnippet,
  onToggleFavorite
}: OverviewListViewProps) {
  const snippets = mode === "trash"
    ? trashSnippets
    : mode === "search"
      ? searchOverview?.snippets ?? []
      : [...allSnippets].sort((left, right) => {
        if (left.favorite !== right.favorite) {
          return left.favorite ? -1 : 1;
        }
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });

  const title = mode === "trash" ? "Trash" : mode === "search" ? searchOverview?.title ?? "Search results" : "All snippets";
  const caption = mode === "trash"
    ? `${trashSnippets.length} deleted snippet${trashSnippets.length === 1 ? "" : "s"}`
    : mode === "search"
      ? searchOverview?.caption ?? "Grouped search results"
      : `${allSnippets.length} snippet${allSnippets.length === 1 ? "" : "s"} in your archive`;
  const rowScope = mode === "trash" ? "trash" : mode === "search" ? searchOverview?.scope ?? "search" : null;

  return (
    <section className="all-snippets-view">
      <div className="pane-header detail-pane-header">
        <div>
          <span className="eyebrow">{mode === "search" ? "Search group" : "Library"}</span>
          <h1 className="workspace-title">{title}</h1>
          <p className="overview-caption">{caption}</p>
        </div>
      </div>
      <div className="all-snippets-list">
        {snippets.length === 0 ? (
          <div className="empty-list-card">
            <h3>{mode === "trash" ? "Trash is empty." : "No snippets yet."}</h3>
            <p>{mode === "trash" ? "Deleted snippets will appear here." : "Create a snippet to start building the archive."}</p>
          </div>
        ) : (
          snippets.map((snippet) => (
            <div
              key={snippet.snippetId}
              role="button"
              tabIndex={0}
              className="overview-row"
              onClick={() => onSelectSnippet(snippet.snippetId, rowScope)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectSnippet(snippet.snippetId, rowScope);
                }
              }}
            >
              <div className="overview-row-main">
                <div className="overview-row-copy">
                  <div className="overview-row-title">
                    <h3>{snippet.title}</h3>
                    {snippet.favorite && <Pin size={14} className="favorite-icon" />}
                  </div>
                  <p>{mode === "trash" ? `Deleted · ${formatOverviewSecondary(snippet)}` : formatOverviewSecondary(snippet)}</p>
                </div>
              </div>
              <div className="overview-row-meta">
                {mode === "trash" ? (
                  <div className="overview-row-actions">
                    <button
                      className="icon-button ghost mini"
                      aria-label="Restore snippet"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onRestoreSnippet(snippet.snippetId);
                      }}
                      data-tooltip="Restore"
                    >
                      <FolderOpen size={14} />
                    </button>
                    <button
                      className="icon-button ghost mini danger-icon"
                      aria-label="Delete snippet permanently"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteSnippet(snippet);
                      }}
                      data-tooltip="Delete permanently"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="overview-row-actions">
                    <button
                      className={`icon-button ghost mini ${snippet.favorite ? "favorite-icon" : ""}`}
                      aria-label={snippet.favorite ? "Unpin snippet" : "Pin snippet"}
                      onClick={(event) => {
                        event.stopPropagation();
                        void onToggleFavorite(snippet);
                      }}
                      data-tooltip={snippet.favorite ? "Unpin" : "Pin"}
                    >
                      <Pin size={14} />
                    </button>
                    <span>{formatOverviewTimestamp(snippet.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
