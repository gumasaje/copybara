import { PanelLeftClose, Plus, Search } from "lucide-react";
import { FoldersSection } from "../sidebar/FoldersSection";
import { PinnedSection } from "../sidebar/PinnedSection";
import { RecentsSection } from "../sidebar/RecentsSection";
import { SearchResultsSection } from "../sidebar/SearchResultsSection";
import { SidebarFooter } from "../sidebar/SidebarFooter";
import type { Category, SnippetSummary, User } from "../../types";

type SidebarPaneProps = {
  user: User;
  categories: Category[];
  allSnippets: SnippetSummary[];
  trashSnippets: SnippetSummary[];
  favoriteSnippets: SnippetSummary[];
  recentSnippets: SnippetSummary[];
  uncategorizedSnippets: SnippetSummary[];
  selectedSnippetId: number | null;
  selectedSidebarScope: string | null;
  openFolderMenuId: number | null;
  openSidebarSnippetMenuId: string | null;
  activeDropTarget: string | null;
  draggedCategoryId: number | null;
  isSearchMode: boolean;
  isFavoritesExpanded: boolean;
  isRecentsExpanded: boolean;
  isFoldersExpanded: boolean;
  searchInput: string;
  overviewMode: "all" | "trash" | null;
  expandedCategories: Set<number>;
  sidebarSnippetMenuKey: (scope: string, snippetId: number) => string;
  onGoHome: () => void;
  onCloseSidebar: () => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onOpenCreateSnippet: () => void;
  onToggleFavoritesExpanded: () => void;
  onToggleRecentsExpanded: () => void;
  onToggleFoldersExpanded: () => void;
  onViewAll: () => void;
  onOpenSnippet: (snippetId: number, scope: string) => void;
  onSidebarItemKeyDown: (event: React.KeyboardEvent<HTMLElement>, snippetId: number, scope: string) => void;
  onSnippetDragStart: (snippet: SnippetSummary, event: React.DragEvent<HTMLElement>) => void;
  onSnippetDragEnd: () => void;
  onToggleSnippetMenu: (menuKey: string, triggerElement: HTMLElement | null, pointer?: { x: number; y: number }) => void;
  onOpenCreateCategoryModal: () => void;
  onSelectInbox: () => void;
  onToggleCategory: (categoryId: number) => void;
  onSnippetDragOver: (categoryId: number | null, event: React.DragEvent<HTMLElement>) => void;
  onSnippetDragLeave: (categoryId: number | null, event: React.DragEvent<HTMLElement>) => void;
  onSnippetDrop: (categoryId: number | null, event: React.DragEvent<HTMLElement>) => Promise<void>;
  onCategoryDragStart: (category: Category, event: React.DragEvent<HTMLElement>) => void;
  onCategoryDragEnd: () => void;
  onFolderItemDragOver: (categoryId: number, event: React.DragEvent<HTMLElement>) => void;
  onFolderItemDragLeave: (categoryId: number, event: React.DragEvent<HTMLElement>) => void;
  onFolderItemDrop: (categoryId: number, event: React.DragEvent<HTMLElement>) => Promise<void>;
  onCategoryReorderDragOver: (targetIndex: number, event: React.DragEvent<HTMLElement>) => void;
  onCategoryReorderDragLeave: (targetIndex: number, event: React.DragEvent<HTMLElement>) => void;
  onCategoryReorderDrop: (targetIndex: number, event: React.DragEvent<HTMLElement>) => Promise<void>;
  onToggleFolderMenu: (categoryId: number, triggerElement: HTMLElement | null, pointer?: { x: number; y: number }) => void;
  onOpenTrash: () => void;
  onLogout: () => void;
  sidebarScrollRef: (node: HTMLDivElement | null) => void;
};

export function SidebarPane({
  user,
  categories,
  allSnippets,
  trashSnippets,
  favoriteSnippets,
  recentSnippets,
  uncategorizedSnippets,
  selectedSnippetId,
  selectedSidebarScope,
  openFolderMenuId,
  openSidebarSnippetMenuId,
  activeDropTarget,
  draggedCategoryId,
  isSearchMode,
  isFavoritesExpanded,
  isRecentsExpanded,
  isFoldersExpanded,
  searchInput,
  overviewMode,
  expandedCategories,
  sidebarSnippetMenuKey,
  onGoHome,
  onCloseSidebar,
  onSearchInputChange,
  onSearchSubmit,
  onOpenCreateSnippet,
  onToggleFavoritesExpanded,
  onToggleRecentsExpanded,
  onToggleFoldersExpanded,
  onViewAll,
  onOpenSnippet,
  onSidebarItemKeyDown,
  onSnippetDragStart,
  onSnippetDragEnd,
  onToggleSnippetMenu,
  onOpenCreateCategoryModal,
  onSelectInbox,
  onToggleCategory,
  onSnippetDragOver,
  onSnippetDragLeave,
  onSnippetDrop,
  onCategoryDragStart,
  onCategoryDragEnd,
  onFolderItemDragOver,
  onFolderItemDragLeave,
  onFolderItemDrop,
  onCategoryReorderDragOver,
  onCategoryReorderDragLeave,
  onCategoryReorderDrop,
  onToggleFolderMenu,
  onOpenTrash,
  onLogout,
  sidebarScrollRef
}: SidebarPaneProps) {
  return (
    <aside className="nav-pane">
      <div className="sidebar-top-wrapper">
        <div className="pane-header nav-header">
          <div className="header-logo-group">
            <button className="brand-button" onClick={onGoHome} data-tooltip="Home">
              <h2>Copybara</h2>
            </button>
            <button className="icon-button ghost" onClick={onCloseSidebar} data-tooltip="Hide sidebar · Ctrl/Cmd+B">
              <PanelLeftClose size={18} />
            </button>
          </div>
        </div>

        <div className="sidebar-actions-group">
          <div className="search-box">
            <Search size={14} />
            <input
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSearchSubmit();
                }
              }}
              placeholder="Search"
            />
          </div>
          <button className="primary-button new-snippet-pill" onClick={onOpenCreateSnippet}>
            <Plus size={16} />
            <span>New Snippet</span>
          </button>
        </div>
      </div>

      <div className="sidebar-scroll-area" ref={sidebarScrollRef}>
        <div className="folder-list">
          {isSearchMode ? (
            <SearchResultsSection
              snippets={allSnippets}
              selectedSnippetId={selectedSnippetId}
              selectedSidebarScope={selectedSidebarScope}
              onOpenSnippet={onOpenSnippet}
            />
          ) : (
            <>
              <PinnedSection
                snippets={favoriteSnippets}
                isExpanded={isFavoritesExpanded}
                selectedSnippetId={selectedSnippetId}
                selectedSidebarScope={selectedSidebarScope}
                openSidebarSnippetMenuId={openSidebarSnippetMenuId}
                sidebarSnippetMenuKey={sidebarSnippetMenuKey}
                onToggleExpanded={onToggleFavoritesExpanded}
                onOpenSnippet={onOpenSnippet}
                onSidebarItemKeyDown={onSidebarItemKeyDown}
                onSnippetDragStart={onSnippetDragStart}
                onSnippetDragEnd={onSnippetDragEnd}
                onToggleSnippetMenu={onToggleSnippetMenu}
              />

              <RecentsSection
                snippets={recentSnippets}
                isExpanded={isRecentsExpanded}
                selectedSnippetId={selectedSnippetId}
                selectedSidebarScope={selectedSidebarScope}
                openSidebarSnippetMenuId={openSidebarSnippetMenuId}
                sidebarSnippetMenuKey={sidebarSnippetMenuKey}
                onToggleExpanded={onToggleRecentsExpanded}
                onViewAll={onViewAll}
                onOpenSnippet={onOpenSnippet}
                onSidebarItemKeyDown={onSidebarItemKeyDown}
                onSnippetDragStart={onSnippetDragStart}
                onSnippetDragEnd={onSnippetDragEnd}
                onToggleSnippetMenu={onToggleSnippetMenu}
              />

              <FoldersSection
                isExpanded={isFoldersExpanded}
                categories={categories}
                expandedCategories={expandedCategories}
                uncategorizedSnippets={uncategorizedSnippets}
                allSnippets={allSnippets}
                selectedSnippetId={selectedSnippetId}
                selectedSidebarScope={selectedSidebarScope}
                openFolderMenuId={openFolderMenuId}
                openSidebarSnippetMenuId={openSidebarSnippetMenuId}
                activeDropTarget={activeDropTarget}
                sidebarSnippetMenuKey={sidebarSnippetMenuKey}
                onToggleExpanded={onToggleFoldersExpanded}
                onOpenCreateCategoryModal={onOpenCreateCategoryModal}
                onSelectInbox={onSelectInbox}
                onToggleCategory={onToggleCategory}
                onOpenSnippet={onOpenSnippet}
                onSidebarItemKeyDown={onSidebarItemKeyDown}
                onSnippetDragStart={onSnippetDragStart}
                onSnippetDragEnd={onSnippetDragEnd}
                onSnippetDragOver={onSnippetDragOver}
                onSnippetDragLeave={onSnippetDragLeave}
                onSnippetDrop={onSnippetDrop}
                onCategoryDragStart={onCategoryDragStart}
                onCategoryDragEnd={onCategoryDragEnd}
                draggedCategoryId={draggedCategoryId}
                onFolderItemDragOver={onFolderItemDragOver}
                onFolderItemDragLeave={onFolderItemDragLeave}
                onFolderItemDrop={onFolderItemDrop}
                onCategoryReorderDragOver={onCategoryReorderDragOver}
                onCategoryReorderDragLeave={onCategoryReorderDragLeave}
                onCategoryReorderDrop={onCategoryReorderDrop}
                onToggleSnippetMenu={onToggleSnippetMenu}
                onToggleFolderMenu={onToggleFolderMenu}
              />
            </>
          )}
        </div>
      </div>

      <SidebarFooter
        user={user}
        overviewMode={overviewMode}
        trashCount={trashSnippets.length}
        onOpenTrash={onOpenTrash}
        onLogout={onLogout}
      />
    </aside>
  );
}
