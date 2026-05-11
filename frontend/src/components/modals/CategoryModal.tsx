import { X } from "lucide-react";

type CategoryModalProps = {
  mode: "create" | "rename";
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onClose: () => void;
};

export function CategoryModal({ mode, draft, setDraft, onSubmit, onClose }: CategoryModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="category-modal" onClick={(event) => event.stopPropagation()}>
        <div className="composer-header">
          <div>
            <span className="eyebrow">{mode === "create" ? "New folder" : "Rename folder"}</span>
            <h2>{mode === "create" ? "Create folder" : "Rename folder"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <label className="modal-field">
          <span>Name</span>
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Backend, Algorithms, Notes..."
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void onSubmit();
              }
            }}
          />
        </label>

        <div className="composer-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={() => void onSubmit()}>
            {mode === "create" ? "Create folder" : "Save name"}
          </button>
        </div>
      </div>
    </div>
  );
}
