import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { validateDates, todayStr } from "@/features/projects/utils/dateValidation";

export default function InlineDateEditor({ value, onSave, anchorEl, onClose, createdAt }) {
  const [val, setVal] = useState(value || "");
  const inputRef = useRef(null);
  const ref = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onMD(e) {
      if (ref.current && !ref.current.contains(e.target) && anchorEl && !anchorEl.contains(e.target)) {
        const err = validateDates({ dueDate: val, createdAt });
        if (err) { toast.error(err); }
        else { onSave(val); }
        onClose();
      }
    }
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onMD);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onMD); document.removeEventListener("keydown", onKey); };
  }, [val, onSave, onClose, anchorEl, createdAt]);

  const rect = anchorEl?.getBoundingClientRect();
  if (!rect) return null;

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, zIndex: 9999 }}
      className="bg-popover border border-border rounded-md shadow-xl p-2"
    >
      <input
        ref={inputRef}
        type="date"
        min={todayStr()}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            const err = validateDates({ dueDate: val, createdAt });
            if (err) { toast.error(err); return; }
            onSave(val); onClose();
          }
          if (e.key === "Escape") onClose();
        }}
        className="w-full text-sm border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>,
    document.body
  );
}
