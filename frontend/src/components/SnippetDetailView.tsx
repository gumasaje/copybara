import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { Copy, FolderOpen, Pencil, Pin, Sparkles, Trash2 } from "lucide-react";
import type { SnippetAnalysis, SnippetDetail } from "../types";
import { getExtensions } from "../utils/editor";

type SnippetDetailViewProps = {
  snippetDetail: SnippetDetail;
  snippetAnalysis: SnippetAnalysis | null;
  copyStatus: "idle" | "copied";
  notesDraft: string;
  notesStatus: string | null;
  isSavingNotes: boolean;
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
  onToggleFavorite,
  onEditSnippet,
  onDeleteSnippet,
  onRestoreSnippet,
  onCopySnippet,
  onAnalyze,
  onNotesDraftChange,
  onSaveNotes
}: SnippetDetailViewProps) {
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
            <button className="primary-button compact" onClick={() => void onAnalyze()}>
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
              onChange={(event) => onNotesDraftChange(event.target.value)}
              disabled={snippetDetail.deletedAt != null}
              placeholder="Leave a quick note..."
              onKeyDown={(event) => {
                if (snippetDetail.deletedAt != null) {
                  return;
                }
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void onSaveNotes();
                }
              }}
            />
            <div className="memo-editor-footer">
              <span className="shortcut-hint">
                {snippetDetail.deletedAt != null ? "Restore this snippet to edit notes." : notesStatus ?? "Ctrl/Cmd + Enter to save"}
              </span>
              <button
                className="primary-button compact"
                onClick={() => void onSaveNotes()}
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
            onClick={() => void onAnalyze()}
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
  );
}
