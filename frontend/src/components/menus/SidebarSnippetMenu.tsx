import { FolderPlus, Pencil, Pin, Trash2 } from "lucide-react";
import type { SnippetSummary } from "../../types";
import { FloatingMenu } from "./FloatingMenu";

type SidebarSnippetMenuProps = {
  snippet: SnippetSummary;
  style: { top: number; left: number };
  onClose: () => void;
  onTogglePin: () => Promise<void> | void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
};

export function SidebarSnippetMenu({
  snippet,
  style,
  onClose,
  onTogglePin,
  onRename,
  onMove,
  onDelete
}: SidebarSnippetMenuProps) {
  return (
    <FloatingMenu className="context-menu snippet-context-menu floating-context-menu" style={style}>
      <button
        className="context-menu-item"
        onClick={() => {
          onClose();
          void onTogglePin();
        }}
      >
        <Pin size={14} />
        {snippet.favorite ? "Unpin" : "Pin"}
      </button>
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
        className="context-menu-item"
        onClick={() => {
          onClose();
          onMove();
        }}
      >
        <FolderPlus size={14} />
        Add to folder
      </button>
      <div className="context-divider" />
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
