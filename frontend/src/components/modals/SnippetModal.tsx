import { X } from "lucide-react";
import type { Category } from "../../types";

type SnippetModalProps = {
  mode: "rename" | "move";
  titleDraft: string;
  setTitleDraft: (value: string) => void;
  moveCategoryId: number | null;
  setMoveCategoryId: (value: number | null) => void;
  categories: Category[];
  onSubmit: () => Promise<void> | void;
  onClose: () => void;
};

export function SnippetModal({
  mode,
  titleDraft,
  setTitleDraft,
  moveCategoryId,
  setMoveCategoryId,
  categories,
  onSubmit,
  onClose
}: SnippetModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="category-modal" onClick={(event) => event.stopPropagation()}>
        <div className="composer-header">
          <div>
            <span className="eyebrow">{mode === "rename" ? "Rename snippet" : "Move snippet"}</span>
            <h2>{mode === "rename" ? "Rename snippet" : "Add to folder"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {mode === "rename" ? (
          <label className="modal-field">
            <span>Name</span>
            <input
              autoFocus
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="Snippet title"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void onSubmit();
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
                className={`folder-choice ${moveCategoryId == null ? "selected" : ""}`}
                onClick={() => setMoveCategoryId(null)}
              >
                <div className="folder-choice-copy">
                  <strong>No folder</strong>
                  <span>Keep this snippet in Inbox.</span>
                </div>
                {moveCategoryId == null && <span className="folder-choice-badge">Selected</span>}
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.categoryId}
                  className={`folder-choice ${moveCategoryId === category.categoryId ? "selected" : ""}`}
                  onClick={() => setMoveCategoryId(category.categoryId)}
                >
                  <div className="folder-choice-copy">
                    <strong>{category.name}</strong>
                    <span>{category.snippetCount} snippet{category.snippetCount === 1 ? "" : "s"}</span>
                  </div>
                  {moveCategoryId === category.categoryId && <span className="folder-choice-badge">Selected</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="composer-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={() => void onSubmit()}>
            {mode === "rename" ? "Save name" : "Move snippet"}
          </button>
        </div>
      </div>
    </div>
  );
}
