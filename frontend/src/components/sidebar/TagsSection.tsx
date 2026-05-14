import { ChevronDown, ChevronRight, Hash } from "lucide-react";
import type { SnippetSummary } from "../../types";

export type SidebarTagGroup = {
  tag: string;
  snippets: SnippetSummary[];
};

type TagsSectionProps = {
  tags: SidebarTagGroup[];
  isExpanded: boolean;
  selectedSidebarScope: string | null;
  onToggleExpanded: () => void;
  onOpenTagGroup: (tag: string, snippets: SnippetSummary[], scope: string) => void;
};

export function TagsSection({
  tags,
  isExpanded,
  selectedSidebarScope,
  onToggleExpanded,
  onOpenTagGroup
}: TagsSectionProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`folder-header recents-header ${isExpanded ? "expanded" : ""}`}>
        <button className="recents-toggle" onClick={onToggleExpanded}>
          <span className="eyebrow">Tags</span>
          <span className="recents-chevron">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
      </div>
      {isExpanded && (
        <div className="nested-snippet-list">
          {tags.map((group) => {
            const scope = tagScope(group.tag);
            return (
              <button
                key={group.tag}
                className={`tag-nav-item ${selectedSidebarScope === scope ? "active" : ""}`}
                onClick={() => onOpenTagGroup(group.tag, group.snippets, scope)}
              >
                <span className="tag-nav-main">
                  <Hash size={12} />
                  <span className="truncate">{group.tag}</span>
                </span>
                <span className="tag-nav-count">{group.snippets.length}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export function tagScope(tag: string) {
  return `tag-${encodeURIComponent(tag)}`;
}
