import { useEffect, useState } from "react";
import { api } from "../api";
import type { Category, SnippetAnalysis, SnippetDetail, SnippetSummary, User } from "../types";
import { parseSnippetFilterScope } from "../utils/helpers";

type UseWorkspaceDataParams = {
  user: User | null;
  keyword: string;
  selectedSnippetId: number | null;
  selectedSidebarScope: string | null;
};

export function useWorkspaceData({
  user,
  keyword,
  selectedSnippetId,
  selectedSidebarScope
}: UseWorkspaceDataParams) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSnippets, setAllSnippets] = useState<SnippetSummary[]>([]);
  const [scopedSnippets, setScopedSnippets] = useState<SnippetSummary[] | null>(null);
  const [trashSnippets, setTrashSnippets] = useState<SnippetSummary[]>([]);
  const [snippetDetail, setSnippetDetail] = useState<SnippetDetail | null>(null);
  const [snippetAnalysis, setSnippetAnalysis] = useState<SnippetAnalysis | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesStatus, setNotesStatus] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [screenError, setScreenError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void refreshWorkspace();
  }, [user, keyword]);

  useEffect(() => {
    if (!user) return;

    const scopeFilter = parseSnippetFilterScope(selectedSidebarScope);
    if (scopeFilter == null || keyword.trim().length > 0) {
      setScopedSnippets(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const snippets = await api.getSnippets(scopeFilter);
        if (!cancelled) {
          setScopedSnippets(snippets);
        }
      } catch (error) {
        if (!cancelled) {
          setScreenError(error instanceof Error ? error.message : "필터 결과를 불러오지 못했습니다.");
          setScopedSnippets(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, keyword, selectedSidebarScope]);

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
      setScreenError(null);
      setIsAnalyzing(true);
      const analysis = await api.createAnalysis(snippetDetail.snippetId);
      setSnippetAnalysis(analysis);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : "AI 분석 요청에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
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

  return {
    categories,
    setCategories,
    allSnippets,
    setAllSnippets,
    scopedSnippets,
    trashSnippets,
    setTrashSnippets,
    snippetDetail,
    setSnippetDetail,
    snippetAnalysis,
    setSnippetAnalysis,
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
  };
}
