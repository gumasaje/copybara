import { api } from "../api";
import type { Category, SnippetDetail, SnippetFormState, SnippetSummary } from "../types";
import { parseTags } from "../utils/helpers";

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => Promise<void> | void;
} | null;

type UseWorkspaceActionsParams = {
  formState: SnippetFormState;
  editingSnippet: SnippetDetail | null;
  categoryDraft: string;
  categoryModalMode: "create" | "rename";
  editingCategory: Category | null;
  snippetDetail: SnippetDetail | null;
  snippetModalMode: "rename" | "move" | null;
  snippetModalTarget: SnippetSummary | null;
  snippetTitleDraft: string;
  snippetMoveCategoryId: number | null;
  categories: Category[];
  selectedSnippetId: number | null;
  refreshWorkspace: () => Promise<void>;
  refreshSnippet: (snippetId: number) => Promise<void>;
  setScreenError: (value: string | null) => void;
  setSelectedSnippetId: (value: number | null) => void;
  setSelectedSidebarScope: (value: string | null) => void;
  setSnippetDetail: (value: SnippetDetail | null | ((prev: SnippetDetail | null) => SnippetDetail | null)) => void;
  setNotesDraft: (value: string) => void;
  setCategories: (value: Category[] | ((prev: Category[]) => Category[])) => void;
  setEditingSnippet: (value: SnippetDetail | null) => void;
  setShowComposer: (value: boolean) => void;
  setCategoryDraft: (value: string) => void;
  setEditingCategory: (value: Category | null) => void;
  setShowCategoryModal: (value: boolean) => void;
  setConfirmDialog: (value: ConfirmDialogState) => void;
  closeSnippetModal: () => void;
  focusSnippet: (snippet: SnippetDetail | SnippetSummary) => void;
  goHome: () => void;
};

export function useWorkspaceActions({
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
}: UseWorkspaceActionsParams) {
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

  async function submitCategory() {
    if (!categoryDraft.trim()) return;
    try {
      if (categoryModalMode === "create") {
        await api.createCategory(categoryDraft);
      } else if (editingCategory) {
        await api.updateCategory(editingCategory.categoryId, categoryDraft);
      }
      setCategoryDraft("");
      setEditingCategory(null);
      setShowCategoryModal(false);
      await refreshWorkspace();
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : `카테고리 ${categoryModalMode === "create" ? "생성" : "수정"}에 실패했습니다.`);
    }
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

  async function handleSidebarFavoriteToggle(snippet: SnippetSummary) {
    try {
      await updateSnippetMeta(snippet.snippetId, { favorite: !snippet.favorite });
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "즐겨찾기 변경에 실패했습니다.");
    }
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

  async function handleCategoryReorderDrop(targetIndex: number, draggingCategory: Category) {
    try {
      const orderedCategoryIds = categories.map((category) => category.categoryId);
      const fromIndex = orderedCategoryIds.indexOf(draggingCategory.categoryId);

      if (fromIndex < 0) {
        throw new Error("카테고리 순서를 찾을 수 없습니다.");
      }

      const nextOrder = [...orderedCategoryIds];
      const [movedCategoryId] = nextOrder.splice(fromIndex, 1);
      const adjustedTargetIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      nextOrder.splice(adjustedTargetIndex, 0, movedCategoryId);

      if (orderedCategoryIds.every((categoryId, index) => categoryId === nextOrder[index])) {
        return;
      }

      await api.reorderCategories(nextOrder);

      const categoryMap = new Map(categories.map((category) => [category.categoryId, category]));
      setCategories(
        nextOrder.map((categoryId, index) => ({
          ...categoryMap.get(categoryId)!,
          sortOrder: index + 1
        }))
      );
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "폴더 정렬에 실패했습니다.");
    }
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

  async function handleConfirmDialog(confirmDialog: ConfirmDialogState) {
    if (!confirmDialog) return;
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "요청 처리에 실패했습니다.");
      setConfirmDialog(null);
    }
  }

  return {
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
  };
}
