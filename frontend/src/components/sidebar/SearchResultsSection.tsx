import type { SnippetSummary } from "../../types";

type SearchResultsSectionProps = {
  snippets: SnippetSummary[];
  selectedSnippetId: number | null;
  selectedSidebarScope: string | null;
  onOpenSnippet: (snippetId: number, scope: string) => void;
};

export function SearchResultsSection({
  snippets,
  selectedSnippetId,
  selectedSidebarScope,
  onOpenSnippet
}: SearchResultsSectionProps) {
  return (
    <>
      <div className="folder-header">
        <span className="eyebrow">Search results</span>
      </div>
      <div className="nested-snippet-list">
        {snippets.length === 0 ? (
          <span className="empty-hint">No snippets matched.</span>
        ) : (
          snippets.map((snippet) => (
            <button
              key={snippet.snippetId}
              className={`nested-snippet-item ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "search" ? "active" : ""}`}
              onClick={() => onOpenSnippet(snippet.snippetId, "search")}
            >
              <span className="truncate">{snippet.title}</span>
            </button>
          ))
        )}
      </div>
    </>
  );
}
