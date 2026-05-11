import { useEffect, useMemo, useRef, useState } from "react";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import {
  Copy,
  FolderOpen,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import { api, getStoredToken, setStoredToken } from "./api";
import { AuthPage } from "./components/AuthPage";
import { OverviewListView } from "./components/OverviewListView";
import { FoldersSection } from "./components/sidebar/FoldersSection";
import { PinnedSection } from "./components/sidebar/PinnedSection";
import { RecentsSection } from "./components/sidebar/RecentsSection";
import { SearchResultsSection } from "./components/sidebar/SearchResultsSection";
import { SidebarFooter } from "./components/sidebar/SidebarFooter";
import { CategoryModal } from "./components/modals/CategoryModal";
import { ComposerModal } from "./components/modals/ComposerModal";
import { ConfirmDialog } from "./components/modals/ConfirmDialog";
import { SnippetModal } from "./components/modals/SnippetModal";
import { FolderMenu } from "./components/menus/FolderMenu";
import { SidebarSnippetMenu } from "./components/menus/SidebarSnippetMenu";
import type { Category, SnippetAnalysis, SnippetDetail, SnippetFormState, SnippetSummary, User } from "./types";
import { getExtensions } from "./utils/editor";
import { parseSidebarMenuKey, parseTags } from "./utils/helpers";

const DEFAULT_FORM: SnippetFormState = {
  title: "",
  content: "",
  language: "Java",
  categoryId: null,
  tagsText: "Java"
};

export default function App() {
  const detailPaneRef = useRef<HTMLElement | null>(null);
  const draggedSnippetRef = useRef<SnippetSummary | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSnippets, setAllSnippets] = useState<SnippetSummary[]>([]);
  const [trashSnippets, setTrashSnippets] = useState<SnippetSummary[]>([]);
  const [selectedSnippetId, setSelectedSnippetId] = useState<number | null>(null);
  const [selectedSidebarScope, setSelectedSidebarScope] = useState<string | null>(null);
  const [snippetDetail, setSnippetDetail] = useState<SnippetDetail | null>(null);
  const [snippetAnalysis, setSnippetAnalysis] = useState<SnippetAnalysis | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [screenError, setScreenError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<SnippetDetail | null>(null);
  const [formState, setFormState] = useState<SnippetFormState>(DEFAULT_FORM);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesStatus, setNotesStatus] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
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
  const [openFolderMenuId, setOpenFolderMenuId] = useState<number | null>(null);
  const [openFolderMenuStyle, setOpenFolderMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const [openSidebarSnippetMenuId, setOpenSidebarSnippetMenuId] = useState<string | null>(null);
  const [openSidebarSnippetMenuStyle, setOpenSidebarSnippetMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [snippetModalMode, setSnippetModalMode] = useState<"rename" | "move" | null>(null);
  const [snippetModalTarget, setSnippetModalTarget] = useState<SnippetSummary | null>(null);
  const [snippetTitleDraft, setSnippetTitleDraft] = useState("");
  const [snippetMoveCategoryId, setSnippetMoveCategoryId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(true);
  const [overviewMode, setOverviewMode] = useState<"all" | "trash" | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  const isSearchMode = keyword.trim().length > 0;

  const uncategorizedSnippets = useMemo(() => {
    return allSnippets.filter((s) => s.category == null && !s.favorite);
  }, [allSnippets]);

  const favoriteSnippets = useMemo(() => {
    return allSnippets.filter((s) => s.favorite);
  }, [allSnippets]);

  const recentSnippets = useMemo(() => {
    return allSnippets.filter((s) => !s.favorite).slice(0, 8);
  }, [allSnippets]);

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
      const categoryId = Number(selectedSidebarScope.replace("folder-", ""));
      return allSnippets.filter((snippet) => snippet.category?.categoryId === categoryId);
    }
    return allSnippets;
  }, [allSnippets, favoriteSnippets, recentSnippets, selectedSidebarScope, trashSnippets, uncategorizedSnippets]);

  const activeSidebarMenuTarget = useMemo(() => {
    if (!openSidebarSnippetMenuId) return null;
    const { scope, snippetId } = parseSidebarMenuKey(openSidebarSnippetMenuId);

    if (scope === "favorites") {
      return { scope, snippet: favoriteSnippets.find((snippet) => snippet.snippetId === snippetId) ?? null };
    }
    if (scope === "inbox") {
      return { scope, snippet: uncategorizedSnippets.find((snippet) => snippet.snippetId === snippetId) ?? null };
    }
    if (scope === "recents") {
      return { scope, snippet: recentSnippets.find((snippet) => snippet.snippetId === snippetId) ?? null };
    }
    if (scope.startsWith("folder-")) {
      return {
        scope,
        snippet: allSnippets.find((snippet) => snippet.snippetId === snippetId && snippet.category?.categoryId === Number(scope.replace("folder-", ""))) ?? null
      };
    }
    return { scope, snippet: allSnippets.find((snippet) => snippet.snippetId === snippetId) ?? null };
  }, [allSnippets, favoriteSnippets, openSidebarSnippetMenuId, recentSnippets, uncategorizedSnippets]);

  const activeFolderMenuCategory = useMemo(() => {
    if (openFolderMenuId == null) return null;
    return categories.find((category) => category.categoryId === openFolderMenuId) ?? null;
  }, [categories, openFolderMenuId]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoadingSession(false);
        return;
      }
      try {
        const me = await api.getMe();
        setUser(me);
      } catch {
        setStoredToken(null);
        setToken(null);
      } finally {
        setLoadingSession(false);
      }
    };
    bootstrap();
  }, [token]);

  useEffect(() => {
    setAuthError(null);
  }, [authMode]);

  useEffect(() => {
    if (!user) return;
    void refreshWorkspace();
  }, [user, keyword]);

  useEffect(() => {
    setOpenSidebarSnippetMenuId(null);
  }, [selectedSnippetId, keyword]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".context-menu") || target?.closest("[data-menu-trigger='true']")) {
        return;
      }
      setOpenFolderMenuId(null);
      setOpenFolderMenuStyle(null);
      setOpenSidebarSnippetMenuId(null);
      setOpenSidebarSnippetMenuStyle(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!openFolderMenuId && !openSidebarSnippetMenuId) {
      return;
    }

    function closeFloatingMenus() {
      setOpenFolderMenuId(null);
      setOpenFolderMenuStyle(null);
      setOpenSidebarSnippetMenuId(null);
      setOpenSidebarSnippetMenuStyle(null);
    }

    window.addEventListener("resize", closeFloatingMenus);
    document.addEventListener("scroll", closeFloatingMenus, true);

    return () => {
      window.removeEventListener("resize", closeFloatingMenus);
      document.removeEventListener("scroll", closeFloatingMenus, true);
    };
  }, [openFolderMenuId, openSidebarSnippetMenuId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable ||
        Boolean(target?.closest(".cm-editor"));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b" && !isEditableTarget) {
        event.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (scopedSidebarSnippets.length > 0 && (selectedSnippetId == null || !scopedSidebarSnippets.some((snippet) => snippet.snippetId === selectedSnippetId))) {
      setSelectedSnippetId(scopedSidebarSnippets[0].snippetId);
      return;
    }
    if (scopedSidebarSnippets.length === 0) {
      setSelectedSnippetId(null);
    }
  }, [scopedSidebarSnippets, selectedSnippetId]);

  useEffect(() => {
    if (!selectedSnippetId) {
      setSnippetDetail(null);
      setSnippetAnalysis(null);
      setNotesDraft("");
      setNotesStatus(null);
      return;
    }
    void refreshSnippet(selectedSnippetId);
  }, [selectedSnippetId, selectedSidebarScope]);

  useEffect(() => {
    detailPaneRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedSnippetId, selectedSidebarScope, overviewMode]);

  async function refreshWorkspace() {
    try {
      setScreenError(null);
      const [categoryList, snippetList, trashList] = await Promise.all([
        api.getCategories(),
        api.getSnippets({ keyword }),
        api.getTrashSnippets()
      ]);
      setCategories(categoryList);
      setAllSnippets(snippetList);
      setTrashSnippets(trashList);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "화면을 불러오지 못했습니다.");
    }
  }

  async function refreshSnippet(snippetId: number) {
    try {
      const isTrashScope = selectedSidebarScope === "trash";
      const detail = isTrashScope
        ? await api.getTrashSnippet(snippetId)
        : await api.getSnippet(snippetId);
      setSnippetDetail(detail);
      setNotesDraft(detail.notes ?? "");
      if (isTrashScope) {
        setSnippetAnalysis(null);
        return;
      }
      try {
        const analysis = await api.getAnalysis(snippetId);
        setSnippetAnalysis(analysis);
      } catch {
        setSnippetAnalysis(null);
      }
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "상세 정보를 불러오지 못했습니다.");
    }
  }

  async function handleAuthSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const nickname = String(formData.get("nickname") ?? "");
    setAuthError(null);

    try {
      if (authMode === "signup") {
        await api.signup(email, password, nickname);
      }
      const result = await api.login(email, password);
      setStoredToken(result.accessToken);
      setToken(result.accessToken);
      setUser({ memberId: result.memberId, email: result.email, nickname: result.nickname });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "인증에 실패했습니다.");
    }
  }

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

  async function submitSnippet() {
    try {
      const payload = {
        title: formState.title,
        content: formState.content,
        language: formState.language,
        categoryId: formState.categoryId,
        tags: parseTags(formState.tagsText)
      };
      const saved = editingSnippet
        ? await api.updateSnippet(editingSnippet.snippetId, payload)
        : await api.createSnippet(payload);

      setShowComposer(false);
      setEditingSnippet(null);
      setSelectedSnippetId(saved.snippetId);
      await refreshWorkspace();
      await refreshSnippet(saved.snippetId);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "스니펫 저장에 실패했습니다.");
    }
  }

  async function handleCreateCategory() {
    if (!categoryDraft.trim()) return false;
    try {
      if (categoryModalMode === "create") {
        await api.createCategory(categoryDraft);
      } else if (editingCategory) {
        await api.updateCategory(editingCategory.categoryId, categoryDraft);
      }
      setCategoryDraft("");
      setEditingCategory(null);
      await refreshWorkspace();
      return true;
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : `카테고리 ${categoryModalMode === "create" ? "생성" : "수정"}에 실패했습니다.`);
      return false;
    }
  }

  async function submitCategory() {
    const created = await handleCreateCategory();
    if (!created) return;
    setShowCategoryModal(false);
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

  function openDeleteCategoryDialog(category: Category) {
    setConfirmDialog({
      title: "Delete folder",
      message: `"${category.name}" folder will be removed. Snippets inside will stay in Uncategorized.`,
      confirmLabel: "Delete folder",
      tone: "danger",
      onConfirm: async () => {
        await api.deleteCategory(category.categoryId);
        await refreshWorkspace();
      }
    });
  }

  async function handleFavoriteToggle() {
    if (!snippetDetail) return;
    try {
      const updated = await api.updateFavorite(snippetDetail.snippetId, !snippetDetail.favorite);
      await refreshWorkspace();
      focusSnippet(updated);
      setSnippetDetail(updated);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "즐겨찾기 변경에 실패했습니다.");
    }
  }

  function openDeleteSnippetDialog() {
    if (!snippetDetail) return;
    const isTrashSnippet = snippetDetail.deletedAt != null;
    setConfirmDialog({
      title: isTrashSnippet ? "Delete permanently" : "Move to trash",
      message: isTrashSnippet
              ? `"${snippetDetail.title}" will be deleted permanently.`
              : `"${snippetDetail.title}" will be moved to Trash.`,
      confirmLabel: isTrashSnippet ? "Delete permanently" : "Move to trash",
      tone: "danger",
      onConfirm: async () => {
        if (isTrashSnippet) {
          await api.deleteSnippetPermanently(snippetDetail.snippetId);
          goHome();
          setSnippetDetail(null);
        } else {
          await api.deleteSnippet(snippetDetail.snippetId);
          setSelectedSidebarScope("trash");
          setSelectedSnippetId(snippetDetail.snippetId);
        }
        await refreshWorkspace();
      }
    });
  }

  async function handleRestoreSnippet(snippetId: number) {
    try {
      const restored = await api.restoreSnippet(snippetId);
      await refreshWorkspace();
      focusSnippet(restored);
      setSnippetDetail(restored);
      setNotesDraft(restored.notes ?? "");
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "스니펫 복구에 실패했습니다.");
    }
  }

  async function handleConfirmDialog() {
    if (!confirmDialog) return;
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "요청 처리에 실패했습니다.");
      setConfirmDialog(null);
    }
  }

  async function handleSaveNotes() {
    if (!snippetDetail) return;
    try {
      setScreenError(null);
      setNotesStatus(null);
      setIsSavingNotes(true);
      const response = await api.updateNotes(snippetDetail.snippetId, notesDraft);
      setSnippetDetail((prev) => (prev ? { ...prev, notes: response.notes, updatedAt: response.updatedAt } : prev));
      setNotesDraft(response.notes ?? "");
      setNotesStatus(response.notes == null ? "Notes cleared" : "Notes saved");
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "노트 저장에 실패했습니다.");
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function handleAnalyze() {
    if (!snippetDetail) return;
    try {
      const analysis = await api.createAnalysis(snippetDetail.snippetId);
      setSnippetAnalysis(analysis);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "AI 분석 요청에 실패했습니다.");
    }
  }

  function handleLogout() {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setSelectedSnippetId(null);
    setSnippetDetail(null);
  }

  async function handleCopySnippet() {
    if (!snippetDetail) return;
    try {
      await navigator.clipboard.writeText(snippetDetail.content);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1400);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "복사에 실패했습니다.");
    }
  }

  function goHome() {
    setKeyword("");
    setSearchInput("");
    setExpandedCategories(new Set());
    setIsRecentsExpanded(true);
    setIsFoldersExpanded(true);
    setOverviewMode(null);
    setOpenFolderMenuId(null);
    setOpenFolderMenuStyle(null);
    setOpenSidebarSnippetMenuId(null);
    setOpenSidebarSnippetMenuStyle(null);
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
    setSelectedSidebarScope(scope);
    setSelectedSnippetId(snippetId);
  }

  function handleSidebarItemKeyDown(event: React.KeyboardEvent<HTMLElement>, snippetId: number, scope: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSnippetFromSidebar(snippetId, scope);
    }
  }

  function focusSnippet(snippet: SnippetDetail | SnippetSummary) {
    if (snippet.deletedAt != null) {
      setSelectedSidebarScope("trash");
      setSelectedSnippetId(snippet.snippetId);
      return;
    }
    if (snippet.category?.categoryId != null) {
      setExpandedCategories((prev) => new Set(prev).add(snippet.category!.categoryId));
      setSelectedSidebarScope(`folder-${snippet.category.categoryId}`);
    } else if (snippet.favorite) {
      setIsFavoritesExpanded(true);
      setSelectedSidebarScope("favorites");
    } else {
      setSelectedSidebarScope("inbox");
    }
    setSelectedSnippetId(snippet.snippetId);
  }

  function sidebarSnippetMenuKey(scope: string, snippetId: number) {
    return `${scope}:${snippetId}`;
  }

  function dropTargetKey(categoryId: number | null) {
    return categoryId == null ? "inbox" : `folder-${categoryId}`;
  }

  const SIDEBAR_SNIPPET_MENU_HEIGHT = 146;
  const SIDEBAR_FOLDER_MENU_HEIGHT = 84;

  function resolveFloatingMenuPosition(
    triggerElement: HTMLElement | null,
    estimatedMenuHeight: number,
    estimatedMenuWidth = 160,
    pointer?: { x: number; y: number }
  ) {
    const baseLeft = pointer?.x ?? triggerElement?.getBoundingClientRect().left ?? 0;
    const baseTop = pointer?.y ?? triggerElement?.getBoundingClientRect().top ?? 0;
    const maxLeft = window.innerWidth - estimatedMenuWidth - 12;
    const maxTop = window.innerHeight - estimatedMenuHeight - 12;
    const left = Math.min(Math.max(12, baseLeft), Math.max(12, maxLeft));
    const top = Math.min(Math.max(12, baseTop), Math.max(12, maxTop));
    if (!pointer && triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      const anchoredTop = rect.bottom + estimatedMenuHeight > window.innerHeight - 16
        ? Math.max(12, rect.bottom - estimatedMenuHeight)
        : rect.top;
      const anchoredLeft = Math.max(12, rect.left - estimatedMenuWidth - 8);
      return { top: anchoredTop, left: anchoredLeft };
    }
    return { top, left };
  }

  function toggleSidebarSnippetMenu(
    menuKey: string,
    triggerElement: HTMLElement | null,
    pointer?: { x: number; y: number }
  ) {
    setOpenFolderMenuId(null);
    setOpenFolderMenuStyle(null);
    setOpenSidebarSnippetMenuId((prev) => {
      const next = prev === menuKey ? null : menuKey;
      setOpenSidebarSnippetMenuStyle(
        next ? resolveFloatingMenuPosition(triggerElement, SIDEBAR_SNIPPET_MENU_HEIGHT, 160, pointer) : null
      );
      return next;
    });
  }

  function toggleFolderMenu(
    categoryId: number,
    triggerElement: HTMLElement | null,
    pointer?: { x: number; y: number }
  ) {
    setOpenSidebarSnippetMenuId(null);
    setOpenSidebarSnippetMenuStyle(null);
    setOpenFolderMenuId((prev) => {
      const next = prev === categoryId ? null : categoryId;
      setOpenFolderMenuStyle(
        next ? resolveFloatingMenuPosition(triggerElement, SIDEBAR_FOLDER_MENU_HEIGHT, 160, pointer) : null
      );
      return next;
    });
  }

  async function updateSnippetMeta(snippetId: number, changes: { title?: string; categoryId?: number | null; favorite?: boolean }) {
    const base =
      snippetDetail?.snippetId === snippetId
        ? snippetDetail
        : await api.getSnippet(snippetId);

    const updated = changes.categoryId !== undefined
      ? await api.moveSnippetCategory(snippetId, changes.categoryId)
      : await api.updateSnippet(snippetId, {
          title: changes.title ?? base.title,
          content: base.content,
          language: base.language ?? "Text",
          categoryId: base.category?.categoryId ?? null,
          tags: base.tags
        });

    if (changes.favorite !== undefined) {
      await api.updateFavorite(snippetId, changes.favorite);
    }

    if (selectedSnippetId === snippetId) {
      await refreshSnippet(snippetId);
    }
    await refreshWorkspace();
    return updated;
  }

  async function handleSidebarFavoriteToggle(snippet: SnippetSummary) {
    try {
      await updateSnippetMeta(snippet.snippetId, { favorite: !snippet.favorite });
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "즐겨찾기 변경에 실패했습니다.");
    }
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
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "폴더 이동에 실패했습니다.");
    } finally {
      draggedSnippetRef.current = null;
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

  async function submitSnippetMetaModal() {
    if (!snippetModalTarget || !snippetModalMode) return;
    try {
      if (snippetModalMode === "rename") {
        const nextTitle = snippetTitleDraft.trim();
        if (!nextTitle) return;
        await updateSnippetMeta(snippetModalTarget.snippetId, { title: nextTitle });
      } else {
        const moved = await updateSnippetMeta(snippetModalTarget.snippetId, { categoryId: snippetMoveCategoryId });
        focusSnippet(moved);
      }
      closeSnippetModal();
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "스니펫 수정에 실패했습니다.");
    }
  }

  function openDeleteSnippetDialogFromSummary(snippet: SnippetSummary) {
    const isTrashSnippet = snippet.deletedAt != null;
    setConfirmDialog({
      title: isTrashSnippet ? "Delete permanently" : "Move to trash",
      message: isTrashSnippet
              ? `"${snippet.title}" will be deleted permanently.`
              : `"${snippet.title}" will be moved to Trash.`,
      confirmLabel: isTrashSnippet ? "Delete permanently" : "Move to trash",
      tone: "danger",
      onConfirm: async () => {
        if (isTrashSnippet) {
          await api.deleteSnippetPermanently(snippet.snippetId);
          if (selectedSnippetId === snippet.snippetId) {
            goHome();
            setSnippetDetail(null);
          }
        } else {
          await api.deleteSnippet(snippet.snippetId);
          setSelectedSidebarScope("trash");
          setSelectedSnippetId(snippet.snippetId);
        }
        await refreshWorkspace();
      }
    });
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
      <aside className="nav-pane">
        <div className="sidebar-top-wrapper">
          <div className="pane-header nav-header">
            <div className="header-logo-group">
              <button className="brand-button" onClick={goHome} data-tooltip="Home">
                <h2>Copybara</h2>
              </button>
              <button className="icon-button ghost" onClick={() => setIsSidebarOpen(false)} data-tooltip="Hide sidebar · Ctrl/Cmd+B">
                <PanelLeftClose size={18} />
              </button>
            </div>
          </div>

          <div className="sidebar-actions-group">
            <div className="search-box">
              <Search size={14} />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setKeyword(searchInput);
                  }
                }}
                placeholder="Search"
              />
            </div>
            <button className="primary-button new-snippet-pill" onClick={openCreateSnippet}>
              <Plus size={16} />
              <span>New Snippet</span>
            </button>
          </div>
        </div>

        <div className="sidebar-scroll-area">
          <div className="folder-list">
            {isSearchMode ? (
              <SearchResultsSection
                snippets={allSnippets}
                selectedSnippetId={selectedSnippetId}
                selectedSidebarScope={selectedSidebarScope}
                onOpenSnippet={openSnippetFromSidebar}
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
                  onToggleExpanded={() => setIsFavoritesExpanded((prev) => !prev)}
                  onOpenSnippet={openSnippetFromSidebar}
                  onSidebarItemKeyDown={handleSidebarItemKeyDown}
                  onSnippetDragStart={handleSnippetDragStart}
                  onSnippetDragEnd={handleSnippetDragEnd}
                  onToggleSnippetMenu={toggleSidebarSnippetMenu}
                />

                <RecentsSection
                  snippets={recentSnippets}
                  isExpanded={isRecentsExpanded}
                  selectedSnippetId={selectedSnippetId}
                  selectedSidebarScope={selectedSidebarScope}
                  openSidebarSnippetMenuId={openSidebarSnippetMenuId}
                  sidebarSnippetMenuKey={sidebarSnippetMenuKey}
                  onToggleExpanded={() => setIsRecentsExpanded((prev) => !prev)}
                  onViewAll={() => {
                    setOverviewMode("all");
                    setIsRecentsExpanded(true);
                  }}
                  onOpenSnippet={openSnippetFromSidebar}
                  onSidebarItemKeyDown={handleSidebarItemKeyDown}
                  onSnippetDragStart={handleSnippetDragStart}
                  onSnippetDragEnd={handleSnippetDragEnd}
                  onToggleSnippetMenu={toggleSidebarSnippetMenu}
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
                  onToggleExpanded={() => setIsFoldersExpanded((prev) => !prev)}
                  onOpenCreateCategoryModal={openCreateCategoryModal}
                  onSelectInbox={() => {
                    setOverviewMode(null);
                    setSelectedSidebarScope("inbox");
                    if (uncategorizedSnippets.length > 0) {
                      setSelectedSnippetId(uncategorizedSnippets[0].snippetId);
                    }
                  }}
                  onToggleCategory={(categoryId) => {
                    setOverviewMode(null);
                    toggleCategory(categoryId);
                  }}
                  onOpenSnippet={openSnippetFromSidebar}
                  onSidebarItemKeyDown={handleSidebarItemKeyDown}
                  onSnippetDragStart={handleSnippetDragStart}
                  onSnippetDragEnd={handleSnippetDragEnd}
                  onSnippetDragOver={handleSnippetDragOver}
                  onSnippetDragLeave={handleSnippetDragLeave}
                  onSnippetDrop={handleSnippetDrop}
                  onToggleSnippetMenu={toggleSidebarSnippetMenu}
                  onToggleFolderMenu={toggleFolderMenu}
                />
              </>
            )}
          </div>
        </div>

        <SidebarFooter
          user={user}
          overviewMode={overviewMode}
          trashCount={trashSnippets.length}
          onOpenTrash={() => setOverviewMode("trash")}
          onLogout={handleLogout}
        />
      </aside>

      <main
        className="detail-pane workspace-pane"
        ref={(node) => {
          detailPaneRef.current = node;
        }}
      >
        {!isSidebarOpen && (
          <div className="floating-toggle">
            <button className="icon-button" onClick={() => setIsSidebarOpen(true)} data-tooltip="Show sidebar · Ctrl/Cmd+B">
              <PanelLeftOpen size={16} />
            </button>
            <button className="icon-button" onClick={openCreateSnippet} data-tooltip="New snippet">
              <Plus size={16} />
            </button>
          </div>
        )}
        {screenError && <div className="banner error">{screenError}</div>}
        {overviewMode ? (
          <OverviewListView
            mode={overviewMode}
            allSnippets={allSnippets}
            trashSnippets={trashSnippets}
            onSelectSnippet={(snippetId, scope) => {
              setOverviewMode(null);
              setSelectedSidebarScope(scope);
              setSelectedSnippetId(snippetId);
            }}
            onRestoreSnippet={handleRestoreSnippet}
            onDeleteSnippet={openDeleteSnippetDialogFromSummary}
          />
        ) : snippetDetail ? (
          <>
            <div className="pane-header detail-pane-header">
              <div>
                <h1 className="workspace-title">{snippetDetail.title}</h1>
              </div>
              <div className="header-actions">
                {snippetDetail.deletedAt == null ? (
                  <>
                    <button className="icon-button" onClick={() => void handleFavoriteToggle()} data-tooltip={snippetDetail.favorite ? "Unpin" : "Pin"}>
                      <Pin size={16} className={snippetDetail.favorite ? "favorite-icon" : ""} />
                    </button>
                    <button className="icon-button" onClick={openEditSnippet} data-tooltip="Edit snippet">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-button" onClick={openDeleteSnippetDialog} data-tooltip="Move to trash">
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="icon-button" onClick={() => void handleRestoreSnippet(snippetDetail.snippetId)} data-tooltip="Restore">
                      <FolderOpen size={16} />
                    </button>
                    <button className="icon-button" onClick={openDeleteSnippetDialog} data-tooltip="Delete permanently">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {snippetDetail.tags.length > 0 && (
              <div className="workspace-meta">
                <div className="tag-row compact-tags">
                  {snippetDetail.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="editor-toolbar workspace-toolbar">
              <div className="toolbar-actions">
                <button
                  className={`icon-button ${copyStatus === "copied" ? "copy-feedback-icon" : ""}`}
                  onClick={() => void handleCopySnippet()}
                  data-tooltip={copyStatus === "copied" ? "Copied!" : "Copy"}
                >
                  <Copy size={16} />
                </button>
                {snippetDetail.deletedAt == null && (
                  <button className="primary-button compact" onClick={() => void handleAnalyze()}>
                  <Sparkles size={16} />
                  AI summarize
                  </button>
                )}
              </div>
            </div>

            <div className="code-panel workspace-editor">
              <CodeMirror
                value={snippetDetail.content}
                extensions={getExtensions(snippetDetail.language ?? "text")}
                theme={oneDark}
                editable={false}
                basicSetup={{ lineNumbers: true, highlightActiveLine: false }}
              />
            </div>

            <section className="detail-card tab-card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">Resources</span>
                  <h3>Notes & Files</h3>
                </div>
              </div>
              <div className="resource-subsection">
                <div className="resource-subsection-header">
                  <span className="eyebrow">Notes</span>
                </div>
                <div className="memo-editor-container">
                  <textarea
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    disabled={snippetDetail.deletedAt != null}
                    placeholder="Leave a quick note..."
                    onKeyDown={(event) => {
                      if (snippetDetail.deletedAt != null) {
                        return;
                      }
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault();
                        void handleSaveNotes();
                      }
                    }}
                  />
                  <div className="memo-editor-footer">
                    <span className="shortcut-hint">
                      {snippetDetail.deletedAt != null ? "Restore this snippet to edit notes." : notesStatus ?? "Ctrl/Cmd + Enter to save"}
                    </span>
                    <button
                      className="primary-button compact"
                      onClick={() => void handleSaveNotes()}
                      disabled={isSavingNotes || snippetDetail.deletedAt != null}
                    >
                      {isSavingNotes ? "Saving..." : "Save notes"}
                    </button>
                  </div>
                </div>
              </div>

              {snippetDetail.attachments.length > 0 && (
                <div className="resource-subsection">
                  <div className="resource-subsection-header">
                    <span className="eyebrow">Files</span>
                  </div>
                  <div className="attachment-list">
                    {snippetDetail.attachments.map((attachment) => (
                      <a
                        key={attachment.attachmentId}
                        className="attachment-row"
                        href={`/api/snippets/${snippetDetail.snippetId}/attachments/${attachment.attachmentId}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>{attachment.originalName}</span>
                        <span>{Math.round(attachment.fileSize / 1024)} KB</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="detail-card tab-card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">AI assist</span>
                  <h3>AI Summary</h3>
                </div>
                <button
                  className="primary-button compact"
                  onClick={() => void handleAnalyze()}
                  disabled={snippetDetail.deletedAt != null}
                >
                  <Sparkles size={16} />
                  Run
                </button>
              </div>
              {snippetAnalysis ? (
                <>
                  <p className="analysis-summary">{snippetAnalysis.summary}</p>
                  <ul className="analysis-list">
                    {snippetAnalysis.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className="tag-row">
                    {snippetAnalysis.suggestedTags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="muted-text">
                  {snippetDetail.deletedAt != null
                    ? "Restore this snippet to run AI summary."
                    : "No analysis yet. Run the assistant when you want a summary and tag hints."}
                </p>
              )}
            </section>
          </>
        ) : (
          <div className="empty-state">
            <h1>No snippet selected.</h1>
            <p>Choose a folder and a snippet, or create a new one to shape the workspace.</p>
          </div>
        )}
      </main>

      {showComposer && (
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
          onConfirm={handleConfirmDialog}
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
          onClose={() => setOpenFolderMenuId(null)}
          onRename={() => openRenameCategoryModal(activeFolderMenuCategory)}
          onDelete={() => openDeleteCategoryDialog(activeFolderMenuCategory)}
        />
      )}
    </div>
  );
}
