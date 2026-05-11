import { X } from "lucide-react";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = "default",
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal" onClick={(event) => event.stopPropagation()}>
        <div className="composer-header">
          <div>
            <span className="eyebrow">{tone === "danger" ? "Confirm action" : "Confirm"}</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <p className="confirm-copy">{message}</p>
        <div className="composer-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className={`primary-button ${tone === "danger" ? "danger-button" : ""}`} onClick={() => void onConfirm()}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
