import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type FloatingMenuProps = {
  className: string;
  style: { top: number; left: number };
  children: ReactNode;
};

export function FloatingMenu({ className, style, children }: FloatingMenuProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={className} style={style}>
      {children}
    </div>,
    document.body
  );
}
