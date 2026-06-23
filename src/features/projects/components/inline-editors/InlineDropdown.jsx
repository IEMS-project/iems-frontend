import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export default function InlineDropdown({ options, onSelect, onClose, anchorEl }) {
  const ref = useRef(null);
  useEffect(() => {
    function onMD(e) {
      if (ref.current && !ref.current.contains(e.target) && anchorEl && !anchorEl.contains(e.target)) onClose();
    }
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onMD);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onMD); document.removeEventListener("keydown", onKey); };
  }, [onClose, anchorEl]);

  const rect = anchorEl?.getBoundingClientRect();
  if (!rect) return null;

  // determine available space
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const dropUp = spaceBelow < 220 && spaceAbove > spaceBelow;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        ...(dropUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        minWidth: Math.max(rect.width, 160),
        zIndex: 9999,
      }}
      className="max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-xl py-1"
    >
      {options.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          className="w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-muted text-foreground transition-colors text-left"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSelect(opt.value); }}
        >
          {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
          <span className="truncate flex-1">{opt.label}</span>
          {opt.active && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-blue-500" />}
        </button>
      ))}
    </div>,
    document.body
  );
}
