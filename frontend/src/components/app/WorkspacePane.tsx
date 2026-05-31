import { lazy, Suspense } from "react";
import { PanelLeftOpen, Plus } from "lucide-react";
import type { SearchOverviewState, SnippetAnalysis, SnippetDetail, SnippetSummary } from "../../types";

const OverviewListView = lazy(() => import("../OverviewListView").then((module) => ({ default: module.OverviewListView })));
const SnippetDetailView = lazy(() => import("../SnippetDetailView").then((module) => ({ default: module.SnippetDetailView })));

type WorkspacePaneProps = {
  isSidebarOpen: boolean;
  screenError: string | null;
  overviewMode: "all" | "trash" | "search" | null;
  allSnippets: SnippetSummary[];
  trashSnippets: SnippetSummary[];
  searchOverview: SearchOverviewState | null;
  snippetDetail: SnippetDetail | null;
  snippetAnalysis: SnippetAnalysis | null;
  copyStatus: "idle" | "copied";
  notesDraft: string;
  notesStatus: string | null;
  isSavingNotes: boolean;
  isAnalyzing: boolean;
  onOpenSidebar: () => void;
  onOpenCreateSnippet: () => void;
  onSelectSnippet: (snippetId: number, scope: string | null) => void;
  onRestoreSnippet: (snippetId: number) => Promise<void> | void;
  onDeleteSnippetFromSummary: (snippet: SnippetSummary) => void;
  onToggleFavorite: () => Promise<void> | void;
  onEditSnippet: () => void;
  onDeleteSnippet: () => void;
  onCopySnippet: () => Promise<void> | void;
  onAnalyze: () => Promise<void> | void;
  onNotesDraftChange: (value: string) => void;
  onSaveNotes: () => Promise<void> | void;
  detailPaneRef: (node: HTMLElement | null) => void;
};

export function WorkspacePane({
  isSidebarOpen,
  screenError,
  overviewMode,
  allSnippets,
  trashSnippets,
  searchOverview,
  snippetDetail,
  snippetAnalysis,
  copyStatus,
  notesDraft,
  notesStatus,
  isSavingNotes,
  isAnalyzing,
  onOpenSidebar,
  onOpenCreateSnippet,
  onSelectSnippet,
  onRestoreSnippet,
  onDeleteSnippetFromSummary,
  onToggleFavorite,
  onEditSnippet,
  onDeleteSnippet,
  onCopySnippet,
  onAnalyze,
  onNotesDraftChange,
  onSaveNotes,
  detailPaneRef
}: WorkspacePaneProps) {
  return (
    <main className="detail-pane workspace-pane" ref={detailPaneRef}>
      {!isSidebarOpen && (
        <div className="floating-toggle">
          <button className="icon-button" onClick={onOpenSidebar} data-tooltip="Show sidebar · Ctrl/Cmd+B">
            <PanelLeftOpen size={16} />
          </button>
          <button className="icon-button" onClick={onOpenCreateSnippet} data-tooltip="New snippet">
            <Plus size={16} />
          </button>
        </div>
      )}
      {screenError && <div className="banner error">{screenError}</div>}
      {overviewMode ? (
        <Suspense fallback={<div className="empty-state"><h1>Loading view...</h1></div>}>
          <OverviewListView
            mode={overviewMode}
            allSnippets={allSnippets}
            trashSnippets={trashSnippets}
            searchOverview={searchOverview}
            onSelectSnippet={onSelectSnippet}
            onRestoreSnippet={onRestoreSnippet}
            onDeleteSnippet={onDeleteSnippetFromSummary}
          />
        </Suspense>
      ) : snippetDetail ? (
        <Suspense fallback={<div className="empty-state"><h1>Loading snippet...</h1></div>}>
          <SnippetDetailView
            snippetDetail={snippetDetail}
            snippetAnalysis={snippetAnalysis}
            copyStatus={copyStatus}
            notesDraft={notesDraft}
            notesStatus={notesStatus}
            isSavingNotes={isSavingNotes}
            isAnalyzing={isAnalyzing}
            onToggleFavorite={onToggleFavorite}
            onEditSnippet={onEditSnippet}
            onDeleteSnippet={onDeleteSnippet}
            onRestoreSnippet={onRestoreSnippet}
            onCopySnippet={onCopySnippet}
            onAnalyze={onAnalyze}
            onNotesDraftChange={onNotesDraftChange}
            onSaveNotes={onSaveNotes}
          />
        </Suspense>
      ) : (
        <div className="empty-state">
          <h1>No snippet selected.</h1>
          <p>Choose a folder and a snippet, or create a new one to shape the workspace.</p>
        </div>
      )}
    </main>
  );
}
