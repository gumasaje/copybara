import { useEffect, useState } from "react";
import type { Extension } from "@codemirror/state";
import { X } from "lucide-react";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import type { SnippetFormState } from "../../types";
import { LANGUAGE_OPTIONS, loadExtensions } from "../../utils/editor";

type ComposerModalProps = {
  editing: boolean;
  formState: SnippetFormState;
  onTitleChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onClose: () => void;
};

export function ComposerModal({
  editing,
  formState,
  onTitleChange,
  onLanguageChange,
  onTagsChange,
  onContentChange,
  onSubmit,
  onClose
}: ComposerModalProps) {
  const [editorExtensions, setEditorExtensions] = useState<Extension[]>([]);

  useEffect(() => {
    let active = true;

    void loadExtensions(formState.language).then((extensions) => {
      if (active) {
        setEditorExtensions(extensions);
      }
    });

    return () => {
      active = false;
    };
  }, [formState.language]);

  return (
    <div className="modal-backdrop">
      <div className="linear-dialog">
        <div className="composer-header">
          <div className="header-titles">
            <span className="eyebrow">{editing ? "Edit Archive" : "New Archive"}</span>
            <input
              className="composer-title-input"
              value={formState.title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Snippet title..."
              autoFocus
            />
          </div>
          <button className="icon-button ghost close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="composer-meta-bar">
          <div className="meta-field">
            <span className="meta-label">Language</span>
            <select
              className="meta-select"
              value={formState.language}
              onChange={(event) => onLanguageChange(event.target.value)}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="meta-field full-meta">
            <span className="meta-label">Tags</span>
            <input
              className="meta-input"
              value={formState.tagsText}
              onChange={(event) => onTagsChange(event.target.value)}
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
            onChange={onContentChange}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
          />
        </div>

        <div className="composer-footer">
          <div className="footer-actions spaced-actions modal-primary-first">
            <button className="primary-button save-btn" onClick={() => void onSubmit()}>
              {editing ? "Update Snippet" : "Save to Archive"}
            </button>
            <button className="secondary-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
