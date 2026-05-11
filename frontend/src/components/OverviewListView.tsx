import { FolderOpen, Pin, Trash2 } from "lucide-react";
import type { SnippetSummary } from "../types";
import { formatOverviewSecondary, formatOverviewTimestamp } from "../utils/formatters";

type OverviewListViewProps = {
  mode: "all" | "trash";
  allSnippets: SnippetSummary[];
  trashSnippets: SnippetSummary[];
  onSelectSnippet: (snippetId: number, scope: string | null) => void;
  onRestoreSnippet: (snippetId: number) => Promise<void> | void;
  onDeleteSnippet: (snippet: SnippetSummary) => void;
};

export function OverviewListView({
  mode,
  allSnippets,
  trashSnippets,
  onSelectSnippet,
  onRestoreSnippet,
  onDeleteSnippet
}: OverviewListViewProps) {
  const snippets = mode === "trash" ? trashSnippets : allSnippets;

  return (
    <section className="all-snippets-view">
      <div className="pane-header detail-pane-header">
        <div>
          <span className="eyebrow">Library</span>
          <h1 className="workspace-title">{mode === "trash" ? "Trash" : "All snippets"}</h1>
          <p className="overview-caption">
            {mode === "trash"
              ? `${trashSnippets.length} deleted snippet${trashSnippets.length === 1 ? "" : "s"}`
              : `${allSnippets.length} snippet${allSnippets.length === 1 ? "" : "s"} in your archive`}
          </p>
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
            <button
              key={snippet.snippetId}
              className="overview-row"
              onClick={() => onSelectSnippet(snippet.snippetId, mode === "trash" ? "trash" : null)}
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
                  <span>{formatOverviewTimestamp(snippet.updatedAt)}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
