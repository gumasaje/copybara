import { Pencil, Trash2 } from "lucide-react";
import { FloatingMenu } from "./FloatingMenu";

type FolderMenuProps = {
  style: { top: number; left: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export function FolderMenu({ style, onClose, onRename, onDelete }: FolderMenuProps) {
  return (
    <FloatingMenu className="context-menu folder-context-menu floating-context-menu" style={style}>
      <button
        className="context-menu-item"
        onClick={() => {
          onClose();
          onRename();
        }}
      >
        <Pencil size={14} />
        Rename
      </button>
      <button
        className="context-menu-item danger"
        onClick={() => {
          onClose();
          onDelete();
        }}
      >
        <Trash2 size={14} />
        Delete
      </button>
    </FloatingMenu>
  );
}
