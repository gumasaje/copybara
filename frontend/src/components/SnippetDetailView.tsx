import { useEffect, useState } from "react";
import type { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { Copy, FolderOpen, Loader2, Pencil, Pin, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SnippetAnalysis, SnippetDetail } from "../types";
import { loadExtensions } from "../utils/editor";

type SnippetDetailViewProps = {
  snippetDetail: SnippetDetail;
  snippetAnalysis: SnippetAnalysis | null;
  copyStatus: "idle" | "copied";
  notesDraft: string;
  notesStatus: string | null;
  isSavingNotes: boolean;
  isAnalyzing: boolean;
  onToggleFavorite: () => Promise<void> | void;
  onEditSnippet: () => void;
  onDeleteSnippet: () => void;
  onRestoreSnippet: (snippetId: number) => Promise<void> | void;
  onCopySnippet: () => Promise<void> | void;
  onAnalyze: () => Promise<void> | void;
  onNotesDraftChange: (value: string) => void;
  onSaveNotes: () => Promise<void> | void;
};

export function SnippetDetailView({
  snippetDetail,
  snippetAnalysis,
  copyStatus,
  notesDraft,
  notesStatus,
  isSavingNotes,
  isAnalyzing,
  onToggleFavorite,
  onEditSnippet,
  onDeleteSnippet,
  onRestoreSnippet,
  onCopySnippet,
  onAnalyze,
  onNotesDraftChange,
  onSaveNotes
}: SnippetDetailViewProps) {
  const [editorExtensions, setEditorExtensions] = useState<Extension[]>([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const hasNotes = snippetDetail.notes != null && snippetDetail.notes.trim().length > 0;
  const canEditNotes = snippetDetail.deletedAt == null;

  useEffect(() => {
    let active = true;

    void loadExtensions(snippetDetail.language ?? "text").then((extensions) => {
      if (active) {
        setEditorExtensions(extensions);
      }
    });

    return () => {
      active = false;
    };
  }, [snippetDetail.language]);

  useEffect(() => {
    setIsEditingNotes(false);
  }, [snippetDetail.snippetId]);

  async function saveNotes() {
    await onSaveNotes();
    setIsEditingNotes(false);
  }

  const markdownComponents: Components = {
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  };

  return (
    <>
      <div className="pane-header detail-pane-header">
        <div>
          <h1 className="workspace-title">{snippetDetail.title}</h1>
        </div>
        <div className="header-actions">
          {snippetDetail.deletedAt == null ? (
            <>
              <button className="icon-button" onClick={() => void onToggleFavorite()} data-tooltip={snippetDetail.favorite ? "Unpin" : "Pin"}>
                <Pin size={16} className={snippetDetail.favorite ? "favorite-icon" : ""} />
              </button>
              <button className="icon-button" onClick={onEditSnippet} data-tooltip="Edit snippet">
                <Pencil size={16} />
              </button>
              <button className="icon-button" onClick={onDeleteSnippet} data-tooltip="Move to trash">
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <>
              <button className="icon-button" onClick={() => void onRestoreSnippet(snippetDetail.snippetId)} data-tooltip="Restore">
                <FolderOpen size={16} />
              </button>
              <button className="icon-button" onClick={onDeleteSnippet} data-tooltip="Delete permanently">
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
            onClick={() => void onCopySnippet()}
            data-tooltip={copyStatus === "copied" ? "Copied!" : "Copy"}
          >
            <Copy size={16} />
          </button>
          {snippetDetail.deletedAt == null && (
            <button className="primary-button compact" onClick={() => void onAnalyze()} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
              {isAnalyzing ? "Analyzing..." : "AI summarize"}
            </button>
          )}
        </div>
      </div>

      <div className="code-panel workspace-editor">
        <CodeMirror
          value={snippetDetail.content}
          extensions={editorExtensions}
          theme={oneDark}
          editable={false}
          basicSetup={{ lineNumbers: true, highlightActiveLine: false }}
        />
      </div>

      <section className="detail-card tab-card">
        <div className="card-heading">
          <div>
            <h3>Notes</h3>
          </div>
          {canEditNotes && hasNotes && !isEditingNotes && (
            <button className="secondary-button compact" onClick={() => setIsEditingNotes(true)}>
              Edit
            </button>
          )}
        </div>
        <div className="resource-subsection">
          {isEditingNotes ? (
            <div className="memo-editor-container">
              <textarea
                value={notesDraft}
                onChange={(event) => onNotesDraftChange(event.target.value)}
                disabled={!canEditNotes}
                placeholder="Leave a quick note..."
                onKeyDown={(event) => {
                  if (!canEditNotes) {
                    return;
                  }
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void saveNotes();
                  }
                }}
              />
              <div className="memo-editor-footer">
                <span className="shortcut-hint">
                  {!canEditNotes ? "Restore this snippet to edit notes." : notesStatus ?? "Ctrl/Cmd + Enter to save"}
                </span>
                <div className="memo-editor-actions">
                  <button
                    className="secondary-button compact"
                    onClick={() => {
                      onNotesDraftChange(snippetDetail.notes ?? "");
                      setIsEditingNotes(false);
                    }}
                    disabled={isSavingNotes}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button compact"
                    onClick={() => void saveNotes()}
                    disabled={isSavingNotes || !canEditNotes}
                  >
                    {isSavingNotes ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : hasNotes ? (
            <div className="notes-preview markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {snippetDetail.notes ?? ""}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="notes-empty">
              <p className="muted-text">
                {canEditNotes ? "No note yet." : "Restore this snippet to edit notes."}
              </p>
              {canEditNotes && (
                <button className="secondary-button compact" onClick={() => setIsEditingNotes(true)}>
                  Add note
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="detail-card tab-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">AI assist</span>
            <h3>AI Summary</h3>
          </div>
          <button
            className="primary-button compact"
            onClick={() => void onAnalyze()}
            disabled={snippetDetail.deletedAt != null || isAnalyzing}
          >
            {isAnalyzing ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
            {isAnalyzing ? "Analyzing..." : "Run"}
          </button>
        </div>
        {isAnalyzing ? (
          <p className="muted-text">Analyzing snippet with AI...</p>
        ) : snippetAnalysis ? (
          <>
            <div className="analysis-summary markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {snippetAnalysis.summary}
              </ReactMarkdown>
            </div>
            <ul className="analysis-list">
              {snippetAnalysis.keyPoints.map((point) => (
                <li key={point}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...markdownComponents, p: "span" }}>
                    {point}
                  </ReactMarkdown>
                </li>
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
  );
}
