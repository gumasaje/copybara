import { useEffect, useMemo, useState } from "react";
import type { Category, SnippetSummary } from "../types";
import { parseSidebarMenuKey } from "../utils/helpers";

const SIDEBAR_SNIPPET_MENU_HEIGHT = 146;
const SIDEBAR_FOLDER_MENU_HEIGHT = 84;

type UseSidebarInteractionsParams = {
  categories: Category[];
  allSnippets: SnippetSummary[];
  favoriteSnippets: SnippetSummary[];
  recentSnippets: SnippetSummary[];
  uncategorizedSnippets: SnippetSummary[];
  selectedSnippetId: number | null;
  keyword: string;
};

export function useSidebarInteractions({
  categories,
  allSnippets,
  favoriteSnippets,
  recentSnippets,
  uncategorizedSnippets,
  selectedSnippetId,
  keyword
}: UseSidebarInteractionsParams) {
  const [openFolderMenuId, setOpenFolderMenuId] = useState<number | null>(null);
  const [openFolderMenuStyle, setOpenFolderMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const [openSidebarSnippetMenuId, setOpenSidebarSnippetMenuId] = useState<string | null>(null);
  const [openSidebarSnippetMenuStyle, setOpenSidebarSnippetMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isRecentsExpanded, setIsRecentsExpanded] = useState(true);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  const [draggedCategoryId, setDraggedCategoryId] = useState<number | null>(null);

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

  useEffect(() => {
    setOpenSidebarSnippetMenuId(null);
  }, [selectedSnippetId, keyword]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".context-menu") || target?.closest("[data-menu-trigger='true']")) {
        return;
      }
      closeAllMenus();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!openFolderMenuId && !openSidebarSnippetMenuId) {
      return;
    }

    function closeFloatingMenus() {
      closeAllMenus();
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

  function closeAllMenus() {
    setOpenFolderMenuId(null);
    setOpenFolderMenuStyle(null);
    setOpenSidebarSnippetMenuId(null);
    setOpenSidebarSnippetMenuStyle(null);
  }

  function toggleCategory(categoryId: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function dropTargetKey(categoryId: number | null) {
    return categoryId == null ? "inbox" : `folder-${categoryId}`;
  }

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

  return {
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
  };
}
