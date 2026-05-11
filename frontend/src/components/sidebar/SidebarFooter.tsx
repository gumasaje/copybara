import { LogOut, Trash2 } from "lucide-react";
import type { User } from "../../types";

type SidebarFooterProps = {
  user: User;
  overviewMode: "all" | "trash" | null;
  trashCount: number;
  onOpenTrash: () => void;
  onLogout: () => void;
};

export function SidebarFooter({
  user,
  overviewMode,
  trashCount,
  onOpenTrash,
  onLogout
}: SidebarFooterProps) {
  return (
    <div className="sidebar-footer">
      <button
        className={`sidebar-utility-button ${overviewMode === "trash" ? "active" : ""}`}
        onClick={onOpenTrash}
      >
        <span className="sidebar-utility-main">
          <Trash2 size={14} />
          <span className="sidebar-utility-copy">
            <span className="sidebar-utility-label">Trash</span>
            <span className="sidebar-utility-subtle">Recently deleted</span>
          </span>
        </span>
        {trashCount > 0 && <span className="sidebar-utility-count">{trashCount}</span>}
      </button>
      <div className="user-card">
        <div className="avatar">{user.nickname.charAt(0).toUpperCase()}</div>
        <div className="user-info">
          <span className="nickname">{user.nickname}</span>
        </div>
        <button className="icon-button ghost mini-logout" onClick={onLogout} data-tooltip="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
