import { useEffect, useState } from "react";
import type { Extension } from "@codemirror/state";
import { X } from "lucide-react";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import type { SnippetFormState } from "../../types";
import { LANGUAGE_OPTIONS, loadExtensions } from "../../utils/editor";
import { parseTags } from "../../utils/helpers";

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
  const [tagInput, setTagInput] = useState("");
  const [tagStatus, setTagStatus] = useState<string | null>(null);
  const tags = parseTags(formState.tagsText);

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

  useEffect(() => {
    setTagStatus(null);
  }, [formState.tagsText]);

  function commitTag(rawValue: string) {
    const nextTag = rawValue.trim();
    if (!nextTag) {
      setTagInput("");
      return;
    }

    if (tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setTagStatus(`'${nextTag}' is already added.`);
      setTagInput("");
      return;
    }

    onTagsChange([...tags, nextTag].join(", "));
    setTagInput("");
    setTagStatus(null);
  }

  function removeTag(targetTag: string) {
    onTagsChange(tags.filter((tag) => tag !== targetTag).join(", "));
    setTagStatus(null);
  }

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
            <div className="tag-input-shell">
              <div className="tag-editor">
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip composer-tag-chip">
                    <span>{tag}</span>
                    <button
                      type="button"
                      className="tag-chip-remove"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  className="tag-editor-input"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      commitTag(tagInput);
                    }
                    if (event.key === "Backspace" && tagInput.length === 0 && tags.length > 0) {
                      event.preventDefault();
                      removeTag(tags[tags.length - 1]);
                    }
                  }}
                  onBlur={() => commitTag(tagInput)}
                  placeholder={tags.length === 0 ? "Type a tag and press Enter" : "Add another tag"}
                />
              </div>
              <p className="tag-editor-hint">
                {tagStatus ?? "Press Enter or comma to add a tag. Backspace removes the last tag."}
              </p>
            </div>
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
