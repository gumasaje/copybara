import { ChevronDown, ChevronRight, MoreHorizontal, Pin } from "lucide-react";
import type { SnippetSummary } from "../../types";

type PinnedSectionProps = {
  snippets: SnippetSummary[];
  isExpanded: boolean;
  selectedSnippetId: number | null;
  selectedSidebarScope: string | null;
  openSidebarSnippetMenuId: string | null;
  sidebarSnippetMenuKey: (scope: string, snippetId: number) => string;
  onToggleExpanded: () => void;
  onOpenSnippet: (snippetId: number, scope: string) => void;
  onSidebarItemKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, snippetId: number, scope: string) => void;
  onSnippetDragStart: (snippet: SnippetSummary, event: React.DragEvent<HTMLElement>) => void;
  onSnippetDragEnd: () => void;
  onToggleSnippetMenu: (
    key: string,
    target: HTMLElement,
    origin?: { x: number; y: number }
  ) => void;
};

export function PinnedSection({
  snippets,
  isExpanded,
  selectedSnippetId,
  selectedSidebarScope,
  openSidebarSnippetMenuId,
  sidebarSnippetMenuKey,
  onToggleExpanded,
  onOpenSnippet,
  onSidebarItemKeyDown,
  onSnippetDragStart,
  onSnippetDragEnd,
  onToggleSnippetMenu
}: PinnedSectionProps) {
  if (snippets.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`folder-header recents-header ${isExpanded ? "expanded" : ""}`}>
        <button className="recents-toggle" onClick={onToggleExpanded}>
          <span className="eyebrow section-label-with-icon favorites-section-label">
            <span className="section-icon-badge">
              <Pin size={10} />
            </span>
            Pinned
          </span>
          <span className="recents-chevron">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
      </div>
      {isExpanded && (
        <div className="nested-snippet-list">
          {snippets.map((snippet) => (
            <div
              key={snippet.snippetId}
              className={`nested-snippet-row ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "favorites" ? "active" : ""} ${openSidebarSnippetMenuId === sidebarSnippetMenuKey("favorites", snippet.snippetId) ? "menu-open" : ""}`}
              onContextMenu={(event) => {
                event.preventDefault();
                onToggleSnippetMenu(
                  sidebarSnippetMenuKey("favorites", snippet.snippetId),
                  event.currentTarget,
                  { x: event.clientX, y: event.clientY }
                );
              }}
            >
              <div
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(event) => onSnippetDragStart(snippet, event)}
                onDragEnd={onSnippetDragEnd}
                className={`nested-snippet-item ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "favorites" ? "active" : ""}`}
                onClick={() => onOpenSnippet(snippet.snippetId, "favorites")}
                onKeyDown={(event) => onSidebarItemKeyDown(event, snippet.snippetId, "favorites")}
              >
                <span className="truncate">{snippet.title}</span>
              </div>
              <div className="snippet-row-actions">
                <button
                  className="icon-button ghost mini"
                  data-menu-trigger="true"
                  onClick={(event) => {
                    onToggleSnippetMenu(sidebarSnippetMenuKey("favorites", snippet.snippetId), event.currentTarget);
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
