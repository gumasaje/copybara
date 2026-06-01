import type { SnippetSummary } from "../../types";

type SearchResultsSectionProps = {
  snippets: SnippetSummary[];
  query: string;
  selectedSnippetId: number | null;
  selectedSidebarScope: string | null;
  resultScope: string;
  onOpenSnippet: (snippetId: number, scope: string) => void;
};

export function SearchResultsSection({
  snippets,
  query,
  selectedSnippetId,
  selectedSidebarScope,
  resultScope,
  onOpenSnippet
}: SearchResultsSectionProps) {
  return (
    <div className="search-results-panel">
      <div className="search-results-summary">
        <span className="eyebrow">Search results</span>
        <strong>{snippets.length}</strong>
        <span className="search-results-summary-copy">matches for `{query}`</span>
      </div>
      {snippets.length === 0 ? (
        <div className="nested-snippet-list">
          <span className="empty-hint">No snippets matched `{query}`.</span>
        </div>
      ) : (
        <>
          <section className="search-results-section">
            <div className="search-section-header">
              <span>All</span>
              <small>{snippets.length}</small>
            </div>
            <div className="search-result-list">
              {snippets.map((snippet) => (
                <button
                  key={`all-${snippet.snippetId}`}
                  className={`search-result-row ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === resultScope ? "active" : ""}`}
                  onClick={() => onOpenSnippet(snippet.snippetId, resultScope)}
                >
                  <span className="search-result-title truncate">{snippet.title}</span>
                  <span className="search-result-meta truncate">
                    {snippet.language}
                    {snippet.tags.length > 0 ? ` · ${snippet.tags.slice(0, 2).join(", ")}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
