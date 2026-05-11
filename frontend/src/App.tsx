import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import {
  Copy,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FolderPlus,
  LogOut,
  MoreHorizontal,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  X,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import { api, getStoredToken, setStoredToken } from "./api";
import type { Category, SnippetAnalysis, SnippetDetail, SnippetSummary } from "./types";

type User = {
  memberId: number;
  email: string;
  nickname: string;
};

type SnippetFormState = {
  title: string;
  content: string;
  language: string;
  categoryId: number | null;
  tagsText: string;
};

const DEFAULT_FORM: SnippetFormState = {
  title: "",
  content: "",
  language: "Java",
  categoryId: null,
  tagsText: "Java"
};

const LANGUAGE_OPTIONS = ["Java", "JavaScript", "TypeScript", "Python", "SQL", "Text"];

function getExtensions(language: string) {
  switch (language.toLowerCase()) {
    case "java":
      return [java()];
    case "javascript":
    case "typescript":
      return [javascript({ typescript: language.toLowerCase() === "typescript" })];
    case "python":
      return [python()];
    case "sql":
      return [sql()];
    default:
      return [];
  }
}

function parseTags(tagsText: string) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatOverviewTimestamp(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date).toLowerCase();
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatOverviewSecondary(snippet: SnippetSummary) {
  const parts = [];

  if (snippet.language?.trim()) {
    parts.push(snippet.language.trim());
  }

  parts.push(snippet.category?.name ?? "No folder");

  return parts.join(" · ");
}

function parseSidebarMenuKey(menuKey: string) {
  const separatorIndex = menuKey.lastIndexOf(":");
  const scope = menuKey.slice(0, separatorIndex);
  const snippetId = Number(menuKey.slice(separatorIndex + 1));
  return { scope, snippetId };
}

export default function App() {
  const detailPaneRef = useRef<HTMLElement | null>(null);
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

  const editorExtensions = useMemo(() => getExtensions(formState.language), [formState.language]);
  const isSearchMode = keyword.trim().length > 0;

  const uncategorizedSnippets = useMemo(() => {
    return allSnippets.filter((s) => s.category == null && !s.favorite);
  }, [allSnippets]);

  const favoriteSnippets = useMemo(() => {
    return allSnippets.filter((s) => s.favorite);
  }, [allSnippets]);

  const scopedSidebarSnippets = useMemo(() => {
    if (selectedSidebarScope === "trash") {
      return trashSnippets;
    }
    if (selectedSidebarScope === "favorites") {
      return favoriteSnippets;
    }
    if (selectedSidebarScope === "recents") {
      return uncategorizedSnippets;
    }
    if (selectedSidebarScope?.startsWith("folder-")) {
      const categoryId = Number(selectedSidebarScope.replace("folder-", ""));
      return allSnippets.filter((snippet) => snippet.category?.categoryId === categoryId);
    }
    return allSnippets;
  }, [allSnippets, favoriteSnippets, selectedSidebarScope, trashSnippets, uncategorizedSnippets]);

  const activeSidebarMenuTarget = useMemo(() => {
    if (!openSidebarSnippetMenuId) return null;
    const { scope, snippetId } = parseSidebarMenuKey(openSidebarSnippetMenuId);

    if (scope === "favorites") {
      return { scope, snippet: favoriteSnippets.find((snippet) => snippet.snippetId === snippetId) ?? null };
    }
    if (scope === "recents") {
      return { scope, snippet: uncategorizedSnippets.find((snippet) => snippet.snippetId === snippetId) ?? null };
    }
    if (scope.startsWith("folder-")) {
      return {
        scope,
        snippet: allSnippets.find((snippet) => snippet.snippetId === snippetId && snippet.category?.categoryId === Number(scope.replace("folder-", ""))) ?? null
      };
    }
    return { scope, snippet: allSnippets.find((snippet) => snippet.snippetId === snippetId) ?? null };
  }, [allSnippets, favoriteSnippets, openSidebarSnippetMenuId, uncategorizedSnippets]);

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
      setSelectedSidebarScope("recents");
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
      setIsRecentsExpanded(true);
      setSelectedSidebarScope("recents");
    }
    setSelectedSnippetId(snippet.snippetId);
  }

  function sidebarSnippetMenuKey(scope: string, snippetId: number) {
    return `${scope}:${snippetId}`;
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
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-copy">
            <div className="auth-brand">
              <span className="eyebrow">Copybara</span>
              <h1>Personal code archive for snippets you want to keep.</h1>
              <p>Folders on the left, code on the right, and enough structure to find things again later.</p>
            </div>
            <div className="auth-points">
              <div>
                <FolderOpen size={16} />
                <span>Folder-based archive with per-user categories</span>
              </div>
              <div>
                <Sparkles size={16} />
                <span>AI summary and suggested tags when needed</span>
              </div>
              <div>
                <Search size={16} />
                <span>Search, pinned snippets, and recents for quick retrieval</span>
              </div>
            </div>
          </div>
          <div className="auth-form-shell">
            <form
              key={authMode}
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleAuthSubmit(new FormData(event.currentTarget));
              }}
            >
              <div className="auth-form-copy">
                <h2>{authMode === "login" ? "Welcome back" : "Create your archive"}</h2>
                <p>
                  {authMode === "login"
                    ? "Sign in to open your workspace."
                    : "Start with an account and keep your snippets organized."}
                </p>
              </div>
              <label className="auth-field">
                <span>Email</span>
                <input name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label className="auth-field">
                <span>Password</span>
                <input name="password" type="password" placeholder="Enter password" required />
              </label>
              {authMode === "signup" && (
                <label className="auth-field">
                  <span>Nickname</span>
                  <input name="nickname" placeholder="How should we call you?" required />
                </label>
              )}
              {authError && <p className="error-text">{authError}</p>}
              <button className="primary-button auth-submit" type="submit">
                {authMode === "login" ? "Enter archive" : "Create account"}
              </button>
              <p className="auth-switch-text">
                {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => setAuthMode((prev) => (prev === "login" ? "signup" : "login"))}
                >
                  {authMode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
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
              <>
                <div className="folder-header">
                  <span className="eyebrow">Search results</span>
                </div>
                <div className="nested-snippet-list">
                  {allSnippets.length === 0 ? (
                    <span className="empty-hint">No snippets matched.</span>
                  ) : (
                    allSnippets.map((snippet) => (
                      <button
                        key={snippet.snippetId}
                        className={`nested-snippet-item ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "search" ? "active" : ""}`}
                        onClick={() => openSnippetFromSidebar(snippet.snippetId, "search")}
                      >
                        <span className="truncate">{snippet.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {favoriteSnippets.length > 0 && (
                  <>
                    <div className={`folder-header recents-header ${isFavoritesExpanded ? "expanded" : ""}`}>
                      <button className="recents-toggle" onClick={() => setIsFavoritesExpanded((prev) => !prev)}>
                        <span className="eyebrow section-label-with-icon favorites-section-label">
                          <span className="section-icon-badge">
                            <Pin size={10} />
                          </span>
                          Pinned
                        </span>
                        <span className="recents-chevron">
                          {isFavoritesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      </button>
                    </div>
                    {isFavoritesExpanded && (
                      <div className="nested-snippet-list">
                        {favoriteSnippets.map((snippet) => (
                          <div
                            key={snippet.snippetId}
                            className={`nested-snippet-row ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "favorites" ? "active" : ""} ${openSidebarSnippetMenuId === sidebarSnippetMenuKey("favorites", snippet.snippetId) ? "menu-open" : ""}`}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              toggleSidebarSnippetMenu(
                                sidebarSnippetMenuKey("favorites", snippet.snippetId),
                                event.currentTarget,
                                { x: event.clientX, y: event.clientY }
                              );
                            }}
                          >
                            <button
                              className={`nested-snippet-item ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "favorites" ? "active" : ""}`}
                              onClick={() => openSnippetFromSidebar(snippet.snippetId, "favorites")}
                            >
                              <span className="truncate">{snippet.title}</span>
                            </button>
                            <div className="snippet-row-actions">
                              <button
                                className="icon-button ghost mini"
                                data-menu-trigger="true"
                                onClick={(event) => {
                                  toggleSidebarSnippetMenu(sidebarSnippetMenuKey("favorites", snippet.snippetId), event.currentTarget);
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
                )}

                <div className={`folder-header recents-header ${isRecentsExpanded ? "expanded" : ""}`}>
                  <button className="recents-toggle" onClick={() => setIsRecentsExpanded((prev) => !prev)}>
                    <span className="eyebrow">Recents</span>
                    <span className="recents-chevron">
                      {isRecentsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>
                  <button
                    className="view-all-button"
                    onClick={() => {
                      setOverviewMode("all");
                      setIsRecentsExpanded(true);
                    }}
                  >
                    View all
                  </button>
                </div>
                {isRecentsExpanded && (
                <div className="nested-snippet-list">
                  {uncategorizedSnippets.map((snippet) => (
                    <div
                      key={snippet.snippetId}
                      className={`nested-snippet-row ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "recents" ? "active" : ""} ${openSidebarSnippetMenuId === sidebarSnippetMenuKey("recents", snippet.snippetId) ? "menu-open" : ""}`}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        toggleSidebarSnippetMenu(
                          sidebarSnippetMenuKey("recents", snippet.snippetId),
                          event.currentTarget,
                          { x: event.clientX, y: event.clientY }
                        );
                      }}
                    >
                      <button
                        className={`nested-snippet-item ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === "recents" ? "active" : ""}`}
                        onClick={() => openSnippetFromSidebar(snippet.snippetId, "recents")}
                      >
                        <span className="truncate">{snippet.title}</span>
                      </button>
                      <div className="snippet-row-actions">
                        <button
                          className="icon-button ghost mini"
                          data-menu-trigger="true"
                          onClick={(event) => {
                            toggleSidebarSnippetMenu(sidebarSnippetMenuKey("recents", snippet.snippetId), event.currentTarget);
                          }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}

                <div className={`folder-header recents-header ${isFoldersExpanded ? "expanded" : ""}`}>
                  <button className="recents-toggle" onClick={() => setIsFoldersExpanded((prev) => !prev)}>
                    <span className="eyebrow">Folders</span>
                    <span className="recents-chevron">
                      {isFoldersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>
                  <button className="icon-button ghost" onClick={openCreateCategoryModal} data-tooltip="New folder">
                    <FolderPlus size={14} />
                  </button>
                </div>

                {isFoldersExpanded && categories.map((category) => {
                  const isExpanded = expandedCategories.has(category.categoryId);
                  const categorySnippets = allSnippets.filter((s) => s.category?.categoryId === category.categoryId);

                  return (
                    <div key={category.categoryId} className="folder-group">
                      <div
                        className={`folder-item ${openFolderMenuId === category.categoryId ? "menu-open" : ""}`}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          toggleFolderMenu(
                            category.categoryId,
                            event.currentTarget,
                            { x: event.clientX, y: event.clientY }
                          );
                        }}
                      >
                        <button
                          className={`folder-row llm-card ${isExpanded ? "expanded" : ""}`}
                          onClick={() => {
                            setOverviewMode(null);
                            toggleCategory(category.categoryId);
                          }}
                        >
                          <div className="folder-row-main">
                            {isExpanded ? <ChevronDown size={14} className="chevron" /> : <ChevronRight size={14} className="chevron" />}
                            <FolderOpen size={14} className="folder-icon" />
                            <span className="card-title">{category.name}</span>
                          </div>
                          <span className="card-meta">{category.snippetCount}</span>
                        </button>
                        <div className="row-actions">
                          <button
                            className="icon-button ghost mini"
                            data-menu-trigger="true"
                            onClick={(event) => {
                              toggleFolderMenu(category.categoryId, event.currentTarget);
                            }}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="nested-snippet-list">
                          {categorySnippets.map((snippet) => (
                            <div
                              key={snippet.snippetId}
                              className={`nested-snippet-row ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === `folder-${category.categoryId}` ? "active" : ""} ${openSidebarSnippetMenuId === sidebarSnippetMenuKey(`folder-${category.categoryId}`, snippet.snippetId) ? "menu-open" : ""}`}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                toggleSidebarSnippetMenu(
                                  sidebarSnippetMenuKey(`folder-${category.categoryId}`, snippet.snippetId),
                                  event.currentTarget,
                                  { x: event.clientX, y: event.clientY }
                                );
                              }}
                            >
                              <button
                                className={`nested-snippet-item ${selectedSnippetId === snippet.snippetId && selectedSidebarScope === `folder-${category.categoryId}` ? "active" : ""}`}
                                onClick={() => openSnippetFromSidebar(snippet.snippetId, `folder-${category.categoryId}`)}
                              >
                                <span className="truncate">{snippet.title}</span>
                              </button>
                              <div className="snippet-row-actions">
                                <button
                                  className="icon-button ghost mini"
                                  data-menu-trigger="true"
                                  onClick={(event) => {
                                    toggleSidebarSnippetMenu(sidebarSnippetMenuKey(`folder-${category.categoryId}`, snippet.snippetId), event.currentTarget);
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
              </>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            className={`sidebar-utility-button ${overviewMode === "trash" ? "active" : ""}`}
            onClick={() => setOverviewMode("trash")}
          >
            <span className="sidebar-utility-main">
              <Trash2 size={14} />
              <span className="sidebar-utility-copy">
                <span className="sidebar-utility-label">Trash</span>
                <span className="sidebar-utility-subtle">Recently deleted</span>
              </span>
            </span>
            {trashSnippets.length > 0 && <span className="sidebar-utility-count">{trashSnippets.length}</span>}
          </button>
          <div className="user-card">
            <div className="avatar">{user.nickname.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="nickname">{user.nickname}</span>
            </div>
            <button className="icon-button ghost mini-logout" onClick={handleLogout} data-tooltip="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
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
          <section className="all-snippets-view">
            <div className="pane-header detail-pane-header">
              <div>
                <span className="eyebrow">Library</span>
                <h1 className="workspace-title">{overviewMode === "trash" ? "Trash" : "All snippets"}</h1>
                <p className="overview-caption">
                  {overviewMode === "trash"
                    ? `${trashSnippets.length} deleted snippet${trashSnippets.length === 1 ? "" : "s"}`
                    : `${allSnippets.length} snippet${allSnippets.length === 1 ? "" : "s"} in your archive`}
                </p>
              </div>
            </div>
            <div className="all-snippets-list">
              {(overviewMode === "trash" ? trashSnippets : allSnippets).length === 0 ? (
                <div className="empty-list-card">
                  <h3>{overviewMode === "trash" ? "Trash is empty." : "No snippets yet."}</h3>
                  <p>{overviewMode === "trash" ? "Deleted snippets will appear here." : "Create a snippet to start building the archive."}</p>
                </div>
              ) : (
                (overviewMode === "trash" ? trashSnippets : allSnippets).map((snippet) => (
                  <button
                    key={snippet.snippetId}
                    className="overview-row"
                    onClick={() => {
                      setOverviewMode(null);
                      setSelectedSidebarScope(overviewMode === "trash" ? "trash" : null);
                      setSelectedSnippetId(snippet.snippetId);
                    }}
                  >
                    <div className="overview-row-main">
                      <div className="overview-row-copy">
                        <div className="overview-row-title">
                          <h3>{snippet.title}</h3>
                          {snippet.favorite && <Pin size={14} className="favorite-icon" />}
                        </div>
                        <p>{overviewMode === "trash" ? `Deleted · ${formatOverviewSecondary(snippet)}` : formatOverviewSecondary(snippet)}</p>
                      </div>
                    </div>
                    <div className="overview-row-meta">
                      {overviewMode === "trash" ? (
                        <div className="overview-row-actions">
                          <button
                            className="icon-button ghost mini"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleRestoreSnippet(snippet.snippetId);
                            }}
                            data-tooltip="Restore"
                          >
                            <FolderOpen size={14} />
                          </button>
                          <button
                            className="icon-button ghost mini danger-icon"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteSnippetDialogFromSummary(snippet);
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
        <div className="modal-backdrop">
          <div className="linear-dialog">
            <div className="composer-header">
              <div className="header-titles">
                <span className="eyebrow">{editingSnippet ? "Edit Archive" : "New Archive"}</span>
                <input
                  className="composer-title-input"
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Snippet title..."
                  autoFocus
                />
              </div>
              <button className="icon-button ghost close-btn" onClick={() => setShowComposer(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="composer-meta-bar">
              <div className="meta-field">
                <span className="meta-label">Language</span>
                <select
                  className="meta-select"
                  value={formState.language}
                  onChange={(event) => setFormState((prev) => ({ ...prev, language: event.target.value }))}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="meta-field full-meta">
                <span className="meta-label">Tags</span>
                <input
                  className="meta-input"
                  value={formState.tagsText}
                  onChange={(event) => setFormState((prev) => ({ ...prev, tagsText: event.target.value }))}
                  placeholder="Add tags separated by comma..."
                />
              </div>
            </div>

            <div className="composer-editor-area">
              <CodeMirror
                value={formState.content}
                height="480px"
                extensions={editorExtensions}
                theme={oneDark}
                onChange={(value) => setFormState((prev) => ({ ...prev, content: value }))}
                basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
              />
            </div>

            <div className="composer-footer">
              <div className="footer-actions spaced-actions modal-primary-first">
                <button className="primary-button save-btn" onClick={() => void submitSnippet()}>
                  {editingSnippet ? "Update Snippet" : "Save to Archive"}
                </button>
                <button className="secondary-button" onClick={() => setShowComposer(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-backdrop" onClick={closeCategoryModal}>
          <div className="category-modal" onClick={(event) => event.stopPropagation()}>
            <div className="composer-header">
              <div>
                <span className="eyebrow">{categoryModalMode === "create" ? "New folder" : "Rename folder"}</span>
                <h2>{categoryModalMode === "create" ? "Create folder" : "Rename folder"}</h2>
              </div>
              <button className="icon-button" onClick={closeCategoryModal}>
                <X size={16} />
              </button>
            </div>

            <label className="modal-field">
              <span>Name</span>
              <input
                autoFocus
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
                placeholder="Backend, Algorithms, Notes..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void submitCategory();
                  }
                }}
              />
            </label>

            <div className="composer-actions">
              <button
                className="secondary-button"
                onClick={closeCategoryModal}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={() => void submitCategory()}
              >
                {categoryModalMode === "create" ? "Create folder" : "Save name"}
              </button>
            </div>
          </div>
        </div>
      )}

      {snippetModalMode && snippetModalTarget && (
        <div className="modal-backdrop" onClick={closeSnippetModal}>
          <div className="category-modal" onClick={(event) => event.stopPropagation()}>
            <div className="composer-header">
              <div>
                <span className="eyebrow">{snippetModalMode === "rename" ? "Rename snippet" : "Move snippet"}</span>
                <h2>{snippetModalMode === "rename" ? "Rename snippet" : "Add to folder"}</h2>
              </div>
              <button className="icon-button" onClick={closeSnippetModal}>
                <X size={16} />
              </button>
            </div>

            {snippetModalMode === "rename" ? (
              <label className="modal-field">
                <span>Name</span>
                <input
                  autoFocus
                  value={snippetTitleDraft}
                  onChange={(event) => setSnippetTitleDraft(event.target.value)}
                  placeholder="Snippet title"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void submitSnippetMetaModal();
                    }
                  }}
                />
              </label>
            ) : (
              <div className="modal-field">
                <span>Folder</span>
                <div className="folder-choice-list">
                  <button
                    type="button"
                    className={`folder-choice ${snippetMoveCategoryId == null ? "selected" : ""}`}
                    onClick={() => setSnippetMoveCategoryId(null)}
                  >
                    <div className="folder-choice-copy">
                      <strong>No folder</strong>
                      <span>Keep this snippet in Recents.</span>
                    </div>
                    {snippetMoveCategoryId == null && <span className="folder-choice-badge">Selected</span>}
                  </button>
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.categoryId}
                      className={`folder-choice ${snippetMoveCategoryId === category.categoryId ? "selected" : ""}`}
                      onClick={() => setSnippetMoveCategoryId(category.categoryId)}
                    >
                      <div className="folder-choice-copy">
                        <strong>{category.name}</strong>
                        <span>{category.snippetCount} snippet{category.snippetCount === 1 ? "" : "s"}</span>
                      </div>
                      {snippetMoveCategoryId === category.categoryId && <span className="folder-choice-badge">Selected</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="composer-actions">
              <button className="secondary-button" onClick={closeSnippetModal}>
                Cancel
              </button>
              <button className="primary-button" onClick={() => void submitSnippetMetaModal()}>
                {snippetModalMode === "rename" ? "Save name" : "Move snippet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="modal-backdrop" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-modal" onClick={(event) => event.stopPropagation()}>
            <div className="composer-header">
              <div>
                <span className="eyebrow">{confirmDialog.tone === "danger" ? "Confirm action" : "Confirm"}</span>
                <h2>{confirmDialog.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setConfirmDialog(null)}>
                <X size={16} />
              </button>
            </div>
            <p className="confirm-copy">{confirmDialog.message}</p>
            <div className="composer-actions">
              <button className="secondary-button" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button
                className={`primary-button ${confirmDialog.tone === "danger" ? "danger-button" : ""}`}
                onClick={() => void handleConfirmDialog()}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {typeof document !== "undefined" && activeSidebarMenuTarget?.snippet && openSidebarSnippetMenuStyle && createPortal(
        <div className="context-menu snippet-context-menu floating-context-menu" style={openSidebarSnippetMenuStyle}>
          <button
            className="context-menu-item"
            onClick={() => {
              setOpenSidebarSnippetMenuId(null);
              void handleSidebarFavoriteToggle(activeSidebarMenuTarget.snippet!);
            }}
          >
            <Pin size={14} />
            {activeSidebarMenuTarget.snippet.favorite ? "Unpin" : "Pin"}
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              setOpenSidebarSnippetMenuId(null);
              openRenameSnippetModal(activeSidebarMenuTarget.snippet!);
            }}
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              setOpenSidebarSnippetMenuId(null);
              openMoveSnippetModal(activeSidebarMenuTarget.snippet!);
            }}
          >
            <FolderPlus size={14} />
            Add to folder
          </button>
          <div className="context-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => {
              setOpenSidebarSnippetMenuId(null);
              openDeleteSnippetDialogFromSummary(activeSidebarMenuTarget.snippet!);
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>,
        document.body
      )}

      {typeof document !== "undefined" && activeFolderMenuCategory && openFolderMenuStyle && createPortal(
        <div className="context-menu folder-context-menu floating-context-menu" style={openFolderMenuStyle}>
          <button
            className="context-menu-item"
            onClick={() => {
              setOpenFolderMenuId(null);
              openRenameCategoryModal(activeFolderMenuCategory);
            }}
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            className="context-menu-item danger"
            onClick={() => {
              setOpenFolderMenuId(null);
              openDeleteCategoryDialog(activeFolderMenuCategory);
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
