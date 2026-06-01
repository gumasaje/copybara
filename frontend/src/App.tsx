import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AuthPage } from "./components/AuthPage";
import { SidebarPane } from "./components/app/SidebarPane";
import { WorkspacePane } from "./components/app/WorkspacePane";
import { CategoryModal } from "./components/modals/CategoryModal";
import { ConfirmDialog } from "./components/modals/ConfirmDialog";
import { SnippetModal } from "./components/modals/SnippetModal";
import { FolderMenu } from "./components/menus/FolderMenu";
import { SidebarSnippetMenu } from "./components/menus/SidebarSnippetMenu";
import { type SidebarTagGroup } from "./components/sidebar/TagsSection";
import type { Category, SearchOverviewState, SnippetDetail, SnippetFormState, SnippetSummary } from "./types";
import { useAuthSession } from "./hooks/useAuthSession";
import { useSidebarInteractions } from "./hooks/useSidebarInteractions";
import { useWorkspaceActions } from "./hooks/useWorkspaceActions";
import { useWorkspaceData } from "./hooks/useWorkspaceData";
import { parseSnippetFilterScope, resolveSnippetFocusScope } from "./utils/helpers";

const ComposerModal = lazy(() => import("./components/modals/ComposerModal").then((module) => ({ default: module.ComposerModal })));
const DEFAULT_FORM: SnippetFormState = {
  title: "",
  content: "",
  language: "Java",
  categoryId: null,
  tagsText: ""
};

export default function App() {
  const detailPaneRef = useRef<HTMLElement | null>(null);
  const sidebarScrollRef = useRef<HTMLDivElement | null>(null);
  const draggedSnippetRef = useRef<SnippetSummary | null>(null);
  const draggedCategoryRef = useRef<Category | null>(null);
  const [selectedSnippetId, setSelectedSnippetId] = useState<number | null>(null);
  const [selectedSidebarScope, setSelectedSidebarScope] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<SnippetDetail | null>(null);
  const [formState, setFormState] = useState<SnippetFormState>(DEFAULT_FORM);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<"create" | "rename">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone?: "default" | "danger";
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [snippetModalMode, setSnippetModalMode] = useState<"rename" | "move" | null>(null);
  const [snippetModalTarget, setSnippetModalTarget] = useState<SnippetSummary | null>(null);
  const [snippetTitleDraft, setSnippetTitleDraft] = useState("");
  const [snippetMoveCategoryId, setSnippetMoveCategoryId] = useState<number | null>(null);
  const [overviewMode, setOverviewMode] = useState<"all" | "trash" | "search" | null>(null);
  const [searchOverview, setSearchOverview] = useState<SearchOverviewState | null>(null);

  const {
    user,
    loadingSession,
    authMode,
    setAuthMode,
    authError,
    handleAuthSubmit,
    handleLogout: logoutSession
  } = useAuthSession();

  const {
    categories,
    setCategories,
    allSnippets,
    scopedSnippets,
    trashSnippets,
    snippetDetail,
    setSnippetDetail,
    snippetAnalysis,
    notesDraft,
    setNotesDraft,
    notesStatus,
    isSavingNotes,
    isAnalyzing,
    copyStatus,
    screenError,
    setScreenError,
    refreshWorkspace,
    refreshSnippet,
    handleSaveNotes,
    handleAnalyze,
    handleCopySnippet
  } = useWorkspaceData({
    user,
    keyword,
    selectedSnippetId,
    selectedSidebarScope
  });

  const {
    submitSnippet,
    submitCategory,
    updateSnippetMeta,
    handleFavoriteToggle,
    handleSidebarFavoriteToggle,
    handleRestoreSnippet,
    handleCategoryReorderDrop,
    openDeleteCategoryDialog,
    openDeleteSnippetDialog,
    openDeleteSnippetDialogFromSummary,
    submitSnippetMetaModal,
    handleConfirmDialog
  } = useWorkspaceActions({
    formState,
    editingSnippet,
    categoryDraft,
    categoryModalMode,
    editingCategory,
    snippetDetail,
    snippetModalMode,
    snippetModalTarget,
    snippetTitleDraft,
    snippetMoveCategoryId,
    categories,
    selectedSnippetId,
    selectedSidebarScope,
    refreshWorkspace,
    refreshSnippet,
    setScreenError,
    setSelectedSnippetId,
    setSelectedSidebarScope,
    setSnippetDetail,
    setNotesDraft,
    setCategories,
    setEditingSnippet,
    setShowComposer,
    setCategoryDraft,
    setEditingCategory,
    setShowCategoryModal,
    setConfirmDialog,
    closeSnippetModal,
    focusSnippet,
    goHome
  });

  const isSearchMode = keyword.trim().length > 0;
  const selectedServerFilter = useMemo(() => parseSnippetFilterScope(selectedSidebarScope), [selectedSidebarScope]);
  const searchResultScope = selectedServerFilter != null && selectedSidebarScope != null ? selectedSidebarScope : "search";

  const uncategorizedSnippets = useMemo(() => {
    return allSnippets.filter((s) => s.category == null && !s.favorite);
  }, [allSnippets]);

  const favoriteSnippets = useMemo(() => {
    return allSnippets.filter((s) => s.favorite);
  }, [allSnippets]);

  const recentSnippets = useMemo(() => {
    return allSnippets.filter((s) => !s.favorite).slice(0, 8);
  }, [allSnippets]);

  const tagGroups = useMemo<SidebarTagGroup[]>(() => {
    const groups = new Map<string, SnippetSummary[]>();

    for (const snippet of allSnippets) {
      for (const tag of snippet.tags) {
        const existing = groups.get(tag) ?? [];
        existing.push(snippet);
        groups.set(tag, existing);
      }
    }

    return [...groups.entries()]
      .map(([tag, snippets]) => ({ tag, snippets }))
      .sort((left, right) => right.snippets.length - left.snippets.length || left.tag.localeCompare(right.tag))
      .slice(0, 12);
  }, [allSnippets]);

  const {
    openFolderMenuId,
    openFolderMenuStyle,
    openSidebarSnippetMenuId,
    setOpenSidebarSnippetMenuId,
    openSidebarSnippetMenuStyle,
    isSidebarOpen,
    setIsSidebarOpen,
    expandedCategories,
    setExpandedCategories,
    isFoldersExpanded,
    setIsFoldersExpanded,
    isFavoritesExpanded,
    setIsFavoritesExpanded,
    isRecentsExpanded,
    setIsRecentsExpanded,
    isTagsExpanded,
    setIsTagsExpanded,
    activeDropTarget,
    setActiveDropTarget,
    draggedCategoryId,
    setDraggedCategoryId,
    activeSidebarMenuTarget,
    activeFolderMenuCategory,
    toggleCategory,
    closeAllMenus,
    dropTargetKey,
    toggleSidebarSnippetMenu,
    toggleFolderMenu
  } = useSidebarInteractions({
    categories,
    allSnippets,
    favoriteSnippets,
    recentSnippets,
    uncategorizedSnippets,
    selectedSnippetId,
    keyword
  });

  const scopedSidebarSnippets = useMemo(() => {
    if (selectedSidebarScope === "trash") {
      return trashSnippets;
    }
    if (selectedSidebarScope === "favorites") {
      return favoriteSnippets;
    }
    if (selectedSidebarScope === "inbox") {
      return uncategorizedSnippets;
    }
    if (selectedSidebarScope === "recents") {
      return recentSnippets;
    }
    if (selectedSidebarScope?.startsWith("folder-")) {
      return scopedSnippets ?? [];
    }
    if (selectedSidebarScope?.startsWith("tag-")) {
      return scopedSnippets ?? [];
    }
    return allSnippets;
  }, [allSnippets, favoriteSnippets, recentSnippets, scopedSnippets, selectedSidebarScope, trashSnippets, uncategorizedSnippets]);

  const selectionCandidateSnippets = isSearchMode ? allSnippets : scopedSidebarSnippets;

  useEffect(() => {
    if (selectionCandidateSnippets.length > 0 && (selectedSnippetId == null || !selectionCandidateSnippets.some((snippet) => snippet.snippetId === selectedSnippetId))) {
      setSelectedSnippetId(selectionCandidateSnippets[0].snippetId);
      return;
    }
    if (selectionCandidateSnippets.length === 0) {
      setSelectedSnippetId(null);
    }
  }, [selectionCandidateSnippets, selectedSnippetId]);

  useEffect(() => {
    detailPaneRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedSnippetId, selectedSidebarScope, overviewMode]);

  useEffect(() => {
    if (overviewMode !== "search" || selectedServerFilter == null || !selectedSidebarScope) {
      return;
    }

    setSearchOverview((prev) => {
      if (prev == null || prev.scope !== selectedSidebarScope) {
        return prev;
      }
      return { ...prev, snippets: scopedSnippets ?? [] };
    });
  }, [overviewMode, scopedSnippets, selectedServerFilter, selectedSidebarScope]);

  function openCreateSnippet() {
    setEditingSnippet(null);
    setFormState({
      ...DEFAULT_FORM,
      categoryId: null
    });
    setShowComposer(true);
  }

  function openEditSnippet() {
    if (!snippetDetail) return;
    setEditingSnippet(snippetDetail);
    setFormState({
      title: snippetDetail.title,
      content: snippetDetail.content,
      language: snippetDetail.language ?? "Text",
      categoryId: snippetDetail.category?.categoryId ?? null,
      tagsText: snippetDetail.tags.join(", ")
    });
    setShowComposer(true);
  }

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setCategoryDraft("");
    setEditingCategory(null);
  }

  function openCreateCategoryModal() {
    setCategoryModalMode("create");
    setCategoryDraft("");
    setEditingCategory(null);
    setShowCategoryModal(true);
  }

  function openRenameCategoryModal(category: Category) {
    setCategoryModalMode("rename");
    setEditingCategory(category);
    setCategoryDraft(category.name);
    setShowCategoryModal(true);
  }

  function handleLogout() {
    logoutSession();
    setSelectedSnippetId(null);
    setSnippetDetail(null);
  }

  function goHome() {
    setKeyword("");
    setSearchInput("");
    setSearchOverview(null);
    setExpandedCategories(new Set());
    setIsRecentsExpanded(true);
    setIsFoldersExpanded(true);
    setIsTagsExpanded(true);
    setOverviewMode(null);
    closeAllMenus();
    if (uncategorizedSnippets.length > 0) {
      setSelectedSidebarScope("inbox");
      setSelectedSnippetId(uncategorizedSnippets[0].snippetId);
      return;
    }
    if (allSnippets.length > 0) {
      setSelectedSidebarScope(null);
      setSelectedSnippetId(allSnippets[0].snippetId);
    }
  }

  function openSnippetFromSidebar(snippetId: number, scope: string) {
    setOverviewMode(null);
    setSearchOverview(null);
    setSelectedSidebarScope(scope);
    setSelectedSnippetId(snippetId);
  }

  function openSearchGroupWithScope(title: string, caption: string, snippets: SnippetSummary[], scope: string) {
    setOverviewMode("search");
    setSearchOverview({ title, caption, scope, snippets });
    setSelectedSidebarScope(scope);
    setSelectedSnippetId(null);
  }

  function handleSidebarItemKeyDown(event: React.KeyboardEvent<HTMLElement>, snippetId: number, scope: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSnippetFromSidebar(snippetId, scope);
    }
  }

  function focusSnippet(snippet: SnippetDetail | SnippetSummary) {
    const scope = resolveSnippetFocusScope(snippet);

    if (scope.startsWith("folder-") && snippet.category?.categoryId != null) {
      setExpandedCategories((prev) => new Set(prev).add(snippet.category!.categoryId));
    } else if (scope === "favorites") {
      setIsFavoritesExpanded(true);
    }
    setSelectedSidebarScope(scope);
    setSelectedSnippetId(snippet.snippetId);
  }

  function sidebarSnippetMenuKey(scope: string, snippetId: number) {
    return `${scope}:${snippetId}`;
  }

  function handleSnippetDragStart(snippet: SnippetSummary, event: React.DragEvent<HTMLElement>) {
    draggedSnippetRef.current = snippet;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(snippet.snippetId));
  }

  function handleSnippetDragEnd() {
    draggedSnippetRef.current = null;
    setActiveDropTarget(null);
  }

  function handleSnippetDragOver(categoryId: number | null, event: React.DragEvent<HTMLElement>) {
    if (!draggedSnippetRef.current) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropTarget(dropTargetKey(categoryId));
  }

  function handleSnippetDragLeave(categoryId: number | null, event: React.DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      const currentTarget = dropTargetKey(categoryId);
      setActiveDropTarget((prev) => (prev === currentTarget ? null : prev));
    }
  }

  async function handleSnippetDrop(categoryId: number | null, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    const draggingSnippet = draggedSnippetRef.current;
    if (!draggingSnippet) return;
    const previousSidebarScrollTop = sidebarScrollRef.current?.scrollTop ?? 0;

    setActiveDropTarget(null);

    const currentCategoryId = draggingSnippet.category?.categoryId ?? null;
    if (currentCategoryId === categoryId) {
      draggedSnippetRef.current = null;
      return;
    }

    try {
      const moved = await updateSnippetMeta(draggingSnippet.snippetId, { categoryId });
      focusSnippet(moved);
      if (categoryId != null) {
        setExpandedCategories((prev) => new Set(prev).add(categoryId));
      } else {
        setIsRecentsExpanded(true);
      }
      requestAnimationFrame(() => {
        if (sidebarScrollRef.current) {
          sidebarScrollRef.current.scrollTop = previousSidebarScrollTop;
        }
      });
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "폴더 이동에 실패했습니다.");
    } finally {
      draggedSnippetRef.current = null;
    }
  }

  function handleCategoryDragStart(category: Category, event: React.DragEvent<HTMLElement>) {
    draggedCategoryRef.current = category;
    setDraggedCategoryId(category.categoryId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-copybara-category", String(category.categoryId));
  }

  function handleCategoryDragEnd() {
    draggedCategoryRef.current = null;
    setDraggedCategoryId(null);
    setActiveDropTarget(null);
  }

  function handleFolderItemDragOver(categoryId: number, event: React.DragEvent<HTMLElement>) {
    handleSnippetDragOver(categoryId, event);
  }

  function handleFolderItemDragLeave(categoryId: number, event: React.DragEvent<HTMLElement>) {
    handleSnippetDragLeave(categoryId, event);
  }

  async function handleFolderItemDrop(categoryId: number, event: React.DragEvent<HTMLElement>) {
    await handleSnippetDrop(categoryId, event);
  }

  function handleCategoryReorderDragOver(targetIndex: number, event: React.DragEvent<HTMLElement>) {
    if (!draggedCategoryRef.current) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropTarget(`folder-slot-${targetIndex}`);
  }

  function handleCategoryReorderDragLeave(targetIndex: number, event: React.DragEvent<HTMLElement>) {
    if (!draggedCategoryRef.current) return;
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      const currentTarget = `folder-slot-${targetIndex}`;
      setActiveDropTarget((prev) => (prev === currentTarget ? null : prev));
    }
  }

  async function onCategoryReorderDrop(targetIndex: number, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    const draggingCategory = draggedCategoryRef.current;
    if (!draggingCategory) return;
    setActiveDropTarget(null);
    try {
      await handleCategoryReorderDrop(targetIndex, draggingCategory);
    } finally {
      draggedCategoryRef.current = null;
      setDraggedCategoryId(null);
    }
  }

  function openRenameSnippetModal(snippet: SnippetSummary) {
    setSnippetModalMode("rename");
    setSnippetModalTarget(snippet);
    setSnippetTitleDraft(snippet.title);
  }

  function openMoveSnippetModal(snippet: SnippetSummary) {
    setSnippetModalMode("move");
    setSnippetModalTarget(snippet);
    setSnippetMoveCategoryId(snippet.category?.categoryId ?? null);
  }

  function closeSnippetModal() {
    setSnippetModalMode(null);
    setSnippetModalTarget(null);
    setSnippetTitleDraft("");
    setSnippetMoveCategoryId(null);
  }

  if (loadingSession) {
    return <div className="boot-screen">Loading Copybara...</div>;
  }

  if (!user) {
    return (
      <AuthPage
        authMode={authMode}
        authError={authError}
        onSubmit={handleAuthSubmit}
        onToggleMode={() => setAuthMode((prev) => (prev === "login" ? "signup" : "login"))}
      />
    );
  }

  return (
    <div className={`app-shell ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}>
      <SidebarPane
        user={user}
        categories={categories}
        allSnippets={allSnippets}
        trashSnippets={trashSnippets}
        favoriteSnippets={favoriteSnippets}
        recentSnippets={recentSnippets}
        uncategorizedSnippets={uncategorizedSnippets}
        selectedSnippetId={selectedSnippetId}
        selectedSidebarScope={selectedSidebarScope}
        openFolderMenuId={openFolderMenuId}
        openSidebarSnippetMenuId={openSidebarSnippetMenuId}
        activeDropTarget={activeDropTarget}
        draggedCategoryId={draggedCategoryId}
        isSearchMode={isSearchMode}
        isFavoritesExpanded={isFavoritesExpanded}
        isRecentsExpanded={isRecentsExpanded}
        isFoldersExpanded={isFoldersExpanded}
        isTagsExpanded={isTagsExpanded}
        searchInput={searchInput}
        searchQuery={keyword}
        searchResultScope={searchResultScope}
        overviewMode={overviewMode}
        expandedCategories={expandedCategories}
        tagGroups={tagGroups}
        sidebarSnippetMenuKey={sidebarSnippetMenuKey}
        onGoHome={goHome}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={() => {
          const nextKeyword = searchInput.trim();
          setKeyword(nextKeyword);
          setOverviewMode(null);
          setSearchOverview(null);
          if (nextKeyword.length > 0 && selectedServerFilter == null) {
            setSelectedSidebarScope("search");
          }
          if (nextKeyword.length === 0 && selectedSidebarScope === "search") {
            setSelectedSidebarScope(null);
          }
        }}
        onOpenCreateSnippet={openCreateSnippet}
        onToggleFavoritesExpanded={() => setIsFavoritesExpanded((prev) => !prev)}
        onToggleRecentsExpanded={() => setIsRecentsExpanded((prev) => !prev)}
        onToggleFoldersExpanded={() => setIsFoldersExpanded((prev) => !prev)}
        onToggleTagsExpanded={() => setIsTagsExpanded((prev) => !prev)}
        onViewAll={() => {
          setOverviewMode("all");
          setSearchOverview(null);
          setIsRecentsExpanded(true);
        }}
        onOpenSnippet={openSnippetFromSidebar}
        onOpenTagGroup={(tag, snippets, scope) =>
          openSearchGroupWithScope(`#${tag}`, `${snippets.length} snippet${snippets.length === 1 ? "" : "s"} tagged with ${tag}`, [], scope)
        }
        onSidebarItemKeyDown={handleSidebarItemKeyDown}
        onSnippetDragStart={handleSnippetDragStart}
        onSnippetDragEnd={handleSnippetDragEnd}
        onToggleSnippetMenu={toggleSidebarSnippetMenu}
        onOpenCreateCategoryModal={openCreateCategoryModal}
        onSelectInbox={() => {
          setOverviewMode(null);
          setSearchOverview(null);
          setSelectedSidebarScope("inbox");
          if (uncategorizedSnippets.length > 0) {
            setSelectedSnippetId(uncategorizedSnippets[0].snippetId);
          }
        }}
        onToggleCategory={(categoryId) => {
          setOverviewMode(null);
          setSearchOverview(null);
          toggleCategory(categoryId);
        }}
        onSnippetDragOver={handleSnippetDragOver}
        onSnippetDragLeave={handleSnippetDragLeave}
        onSnippetDrop={handleSnippetDrop}
        onCategoryDragStart={handleCategoryDragStart}
        onCategoryDragEnd={handleCategoryDragEnd}
        onFolderItemDragOver={handleFolderItemDragOver}
        onFolderItemDragLeave={handleFolderItemDragLeave}
        onFolderItemDrop={handleFolderItemDrop}
        onCategoryReorderDragOver={handleCategoryReorderDragOver}
        onCategoryReorderDragLeave={handleCategoryReorderDragLeave}
        onCategoryReorderDrop={onCategoryReorderDrop}
        onToggleFolderMenu={toggleFolderMenu}
        onOpenTrash={() => {
          setOverviewMode("trash");
          setSearchOverview(null);
        }}
        onLogout={handleLogout}
        sidebarScrollRef={(node) => {
          sidebarScrollRef.current = node;
        }}
      />

      <WorkspacePane
        isSidebarOpen={isSidebarOpen}
        screenError={screenError}
        overviewMode={overviewMode}
        allSnippets={allSnippets}
        trashSnippets={trashSnippets}
        searchOverview={searchOverview}
        snippetDetail={snippetDetail}
        snippetAnalysis={snippetAnalysis}
        copyStatus={copyStatus}
        notesDraft={notesDraft}
        notesStatus={notesStatus}
        isSavingNotes={isSavingNotes}
        isAnalyzing={isAnalyzing}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenCreateSnippet={openCreateSnippet}
        onSelectSnippet={(snippetId, scope) => {
          setOverviewMode(null);
          setSearchOverview(null);
          setSelectedSidebarScope(scope);
          setSelectedSnippetId(snippetId);
        }}
        onRestoreSnippet={handleRestoreSnippet}
        onDeleteSnippetFromSummary={openDeleteSnippetDialogFromSummary}
        onToggleFavoriteFromSummary={handleSidebarFavoriteToggle}
        onToggleFavorite={handleFavoriteToggle}
        onEditSnippet={openEditSnippet}
        onDeleteSnippet={openDeleteSnippetDialog}
        onCopySnippet={handleCopySnippet}
        onAnalyze={handleAnalyze}
        onNotesDraftChange={setNotesDraft}
        onSaveNotes={handleSaveNotes}
        detailPaneRef={(node) => {
          detailPaneRef.current = node;
        }}
      />

      {showComposer && (
        <Suspense fallback={null}>
          <ComposerModal
            editing={editingSnippet != null}
            formState={formState}
            onTitleChange={(value) => setFormState((prev) => ({ ...prev, title: value }))}
            onLanguageChange={(value) => setFormState((prev) => ({ ...prev, language: value }))}
            onTagsChange={(value) => setFormState((prev) => ({ ...prev, tagsText: value }))}
            onContentChange={(value) => setFormState((prev) => ({ ...prev, content: value }))}
            onSubmit={submitSnippet}
            onClose={() => setShowComposer(false)}
          />
        </Suspense>
      )}

      {showCategoryModal && (
        <CategoryModal
          mode={categoryModalMode}
          draft={categoryDraft}
          setDraft={setCategoryDraft}
          onSubmit={submitCategory}
          onClose={closeCategoryModal}
        />
      )}

      {snippetModalMode && snippetModalTarget && (
        <SnippetModal
          mode={snippetModalMode}
          titleDraft={snippetTitleDraft}
          setTitleDraft={setSnippetTitleDraft}
          moveCategoryId={snippetMoveCategoryId}
          setMoveCategoryId={setSnippetMoveCategoryId}
          categories={categories}
          onSubmit={submitSnippetMetaModal}
          onClose={closeSnippetModal}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          tone={confirmDialog.tone}
          onConfirm={() => handleConfirmDialog(confirmDialog)}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {activeSidebarMenuTarget?.snippet && openSidebarSnippetMenuStyle && (
        <SidebarSnippetMenu
          snippet={activeSidebarMenuTarget.snippet}
          style={openSidebarSnippetMenuStyle}
          onClose={() => setOpenSidebarSnippetMenuId(null)}
          onTogglePin={() => handleSidebarFavoriteToggle(activeSidebarMenuTarget.snippet!)}
          onRename={() => openRenameSnippetModal(activeSidebarMenuTarget.snippet!)}
          onMove={() => openMoveSnippetModal(activeSidebarMenuTarget.snippet!)}
          onDelete={() => openDeleteSnippetDialogFromSummary(activeSidebarMenuTarget.snippet!)}
        />
      )}

      {activeFolderMenuCategory && openFolderMenuStyle && (
        <FolderMenu
          style={openFolderMenuStyle}
          onClose={closeAllMenus}
          onRename={() => openRenameCategoryModal(activeFolderMenuCategory)}
          onDelete={() => openDeleteCategoryDialog(activeFolderMenuCategory)}
        />
      )}
    </div>
  );
}
