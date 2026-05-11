import { ChevronDown, ChevronRight, FolderOpen, FolderPlus, GripVertical, Inbox, MoreHorizontal } from "lucide-react";
import type { Category, SnippetSummary } from "../../types";

type FoldersSectionProps = {
  isExpanded: boolean;
  categories: Category[];
  expandedCategories: Set<number>;
  uncategorizedSnippets: SnippetSummary[];
  allSnippets: SnippetSummary[];
  selectedSnippetId: number | null;
  selectedSidebarScope: string | null;
  openFolderMenuId: number | null;
  openSidebarSnippetMenuId: string | null;
  activeDropTarget: string | null;
  sidebarSnippetMenuKey: (scope: string, snippetId: number) => string;
  onToggleExpanded: () => void;
  onOpenCreateCategoryModal: () => void;
  onSelectInbox: () => void;
  onToggleCategory: (categoryId: number) => void;
  onOpenSnippet: (snippetId: number, scope: string) => void;
  onSidebarItemKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, snippetId: number, scope: string) => void;
  onSnippetDragStart: (snippet: SnippetSummary, event: React.DragEvent<HTMLElement>) => void;
  onSnippetDragEnd: () => void;
  onSnippetDragOver: (categoryId: number | null, event: React.DragEvent<HTMLElement>) => void;
  onSnippetDragLeave: (categoryId: number | null, event: React.DragEvent<HTMLElement>) => void;
  onSnippetDrop: (categoryId: number | null, event: React.DragEvent<HTMLElement>) => Promise<void> | void;
  onCategoryDragStart: (category: Category, event: React.DragEvent<HTMLElement>) => void;
  onCategoryDragEnd: () => void;
  draggedCategoryId: number | null;
  onFolderItemDragOver: (categoryId: number, event: React.DragEvent<HTMLElement>) => void;
  onFolderItemDragLeave: (categoryId: number, event: React.DragEvent<HTMLElement>) => void;
  onFolderItemDrop: (categoryId: number, event: React.DragEvent<HTMLElement>) => Promise<void> | void;
  onCategoryReorderDragOver: (targetIndex: number, event: React.DragEvent<HTMLElement>) => void;
  onCategoryReorderDragLeave: (targetIndex: number, event: React.DragEvent<HTMLElement>) => void;
  onCategoryReorderDrop: (targetIndex: number, event: React.DragEvent<HTMLElement>) => Promise<void> | void;
  onToggleSnippetMenu: (
    key: string,
    target: HTMLElement,
    origin?: { x: number; y: number }
  ) => void;
  onToggleFolderMenu: (
    categoryId: number,
    target: HTMLElement,
    origin?: { x: number; y: number }
  ) => void;
};

export function FoldersSection({
  isExpanded,
  categories,
  expandedCategories,
  uncategorizedSnippets,
  allSnippets,
  selectedSnippetId,
  selectedSidebarScope,
  openFolderMenuId,
  openSidebarSnippetMenuId,
  activeDropTarget,
  sidebarSnippetMenuKey,
  onToggleExpanded,
  onOpenCreateCategoryModal,
  onSelectInbox,
  onToggleCategory,
  onOpenSnippet,
  onSidebarItemKeyDown,
  onSnippetDragStart,
  onSnippetDragEnd,
  onSnippetDragOver,
  onSnippetDragLeave,
  onSnippetDrop,
  onCategoryDragStart,
  onCategoryDragEnd,
  draggedCategoryId,
  onFolderItemDragOver,
  onFolderItemDragLeave,
  onFolderItemDrop,
  onCategoryReorderDragOver,
  onCategoryReorderDragLeave,
  onCategoryReorderDrop,
  onToggleSnippetMenu,
  onToggleFolderMenu
}: FoldersSectionProps) {
  return (
    <>
      <div className={`folder-header recents-header ${isExpanded ? "expanded" : ""}`}>
        <button className="recents-toggle" onClick={onToggleExpanded}>
          <span className="eyebrow">Folders</span>
          <span className="recents-chevron">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        <button className="icon-button ghost" onClick={onOpenCreateCategoryModal} data-tooltip="New folder">
          <FolderPlus size={14} />
        </button>
      </div>

      {isExpanded && (
        <>
          <div
            className={`folder-item no-folder-drop-target ${activeDropTarget === "inbox" ? "menu-open" : ""}`}
            onDragOver={(event) => onSnippetDragOver(null, event)}
            onDragLeave={(event) => onSnippetDragLeave(null, event)}
            onDrop={(event) => void onSnippetDrop(null, event)}
          >
            <button
              className={`folder-row llm-card ${selectedSidebarScope === "inbox" ? "expanded" : ""} ${activeDropTarget === "inbox" ? "drop-target-active" : ""}`}
              onClick={onSelectInbox}
            >
              <div className="folder-row-main">
                <Inbox size={14} className="folder-icon no-folder-icon" />
                <span className="card-title">Inbox</span>
              </div>
              <span className="card-meta">{uncategorizedSnippets.length}</span>
            </button>
          </div>

          {categories.map((category, categoryIndex) => {
            const isCategoryExpanded = expandedCategories.has(category.categoryId);
            const categorySnippets = allSnippets.filter((s) => s.category?.categoryId === category.categoryId);

            return (
              <div key={category.categoryId} className="folder-group">
                <div
                  className={`folder-drop-slot ${draggedCategoryId != null ? "visible" : ""} ${activeDropTarget === `folder-slot-${categoryIndex}` ? "active" : ""}`}
                  onDragOver={(event) => onCategoryReorderDragOver(categoryIndex, event)}
                  onDragLeave={(event) => onCategoryReorderDragLeave(categoryIndex, event)}
                  onDrop={(event) => void onCategoryReorderDrop(categoryIndex, event)}
                />
                <div
                  className={`folder-item ${openFolderMenuId === category.categoryId ? "menu-open" : ""}`}
                  onDragOver={(event) => onFolderItemDragOver(category.categoryId, event)}
                  onDragLeave={(event) => onFolderItemDragLeave(category.categoryId, event)}
                  onDrop={(event) => void onFolderItemDrop(category.categoryId, event)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    onToggleFolderMenu(category.categoryId, event.currentTarget, { x: event.clientX, y: event.clientY });
                  }}
                >
                  <button
                    className={`folder-row llm-card ${isCategoryExpanded ? "expanded" : ""} ${activeDropTarget === `folder-${category.categoryId}` ? "drop-target-active" : ""}`}
                    onClick={() => onToggleCategory(category.categoryId)}
                  >
                    <div className="folder-row-main">
                      {isCategoryExpanded ? <ChevronDown size={14} className="chevron" /> : <ChevronRight size={14} className="chevron" />}
                      <FolderOpen size={14} className="folder-icon" />
                      <span className="card-title">{category.name}</span>
                    </div>
                    <span className="card-meta">{category.snippetCount}</span>
                  </button>
                  <div className="row-actions">
                    <button
                      className="icon-button ghost mini folder-drag-handle"
                      draggable
                      data-tooltip="Reorder folder"
                      onDragStart={(event) => onCategoryDragStart(category, event)}
                      onDragEnd={onCategoryDragEnd}
                      onClick={(event) => event.preventDefault()}
                    >
                      <GripVertical size={14} />
                    </button>
                    <button
                      className="icon-button ghost mini"
                      data-menu-trigger="true"
                      onClick={(event) => {
                        onToggleFolderMenu(category.categoryId, event.currentTarget);
                      }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                {isCategoryExpanded && (
                  <div className="nested-snippet-list">
                    {categorySnippets.map((snippet) => (
                      <div
                        key={snippet.snippetId}
                        className={`nested-snippet-row ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === `folder-${category.categoryId}` ? "active" : ""} ${openSidebarSnippetMenuId === sidebarSnippetMenuKey(`folder-${category.categoryId}`, snippet.snippetId) ? "menu-open" : ""}`}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          onToggleSnippetMenu(
                            sidebarSnippetMenuKey(`folder-${category.categoryId}`, snippet.snippetId),
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
                          className={`nested-snippet-item ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === `folder-${category.categoryId}` ? "active" : ""}`}
                          onClick={() => onOpenSnippet(snippet.snippetId, `folder-${category.categoryId}`)}
                          onKeyDown={(event) => onSidebarItemKeyDown(event, snippet.snippetId, `folder-${category.categoryId}`)}
                        >
                          <span className="truncate">{snippet.title}</span>
                        </div>
                        <div className="snippet-row-actions">
                          <button
                            className="icon-button ghost mini"
                            data-menu-trigger="true"
                            onClick={(event) => {
                              onToggleSnippetMenu(sidebarSnippetMenuKey(`folder-${category.categoryId}`, snippet.snippetId), event.currentTarget);
                            }}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {categorySnippets.length === 0 && <span className="empty-hint">Empty folder</span>}
                  </div>
                )}
              </div>
            );
          })}
          {categories.length > 0 && (
            <div
              className={`folder-drop-slot ${draggedCategoryId != null ? "visible" : ""} ${activeDropTarget === `folder-slot-${categories.length}` ? "active" : ""}`}
              onDragOver={(event) => onCategoryReorderDragOver(categories.length, event)}
              onDragLeave={(event) => onCategoryReorderDragLeave(categories.length, event)}
              onDrop={(event) => void onCategoryReorderDrop(categories.length, event)}
            />
          )}
        </>
      )}
    </>
  );
}
