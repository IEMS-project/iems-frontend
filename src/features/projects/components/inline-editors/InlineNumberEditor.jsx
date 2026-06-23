import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isFibonacci, nextFib, prevFib, FIBONACCI } from "../FibonacciStoryPointInput";

export default function InlineNumberEditor({ value, onSave, anchorEl, onClose }) {
  const [val, setVal] = useState(value ?? "");
  const inputRef = useRef(null);
  const ref = useRef(null);
  
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  
  useEffect(() => {
    function onMD(e) {
      if (ref.current && !ref.current.contains(e.target) && anchorEl && !anchorEl.contains(e.target)) {
        // validate on outside click before saving
        if (val === "" || isFibonacci(val)) { onSave(val); }
        else { toast.warning("Story Points must be a Fibonacci number (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)"); }
        onClose();
      }
    }
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onMD);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onMD); document.removeEventListener("keydown", onKey); };
  }, [val, onSave, onClose, anchorEl]);

  const isValid = val === "" || isFibonacci(val);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!isValid) { toast.warning("Story Points must be a Fibonacci number (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)"); return; }
      onSave(val); onClose();
    }
    if (e.key === "Escape") { onClose(); }
    if (e.key === "ArrowUp") { e.preventDefault(); setVal(String(nextFib(val === "" ? -1 : val))); }
    if (e.key === "ArrowDown") { e.preventDefault(); setVal(String(prevFib(val))); }
  };

  const rect = anchorEl?.getBoundingClientRect();
  if (!rect) return null;
  
  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, zIndex: 9999, minWidth: 180 }}
      className="bg-popover border border-border rounded-md shadow-xl p-2 space-y-1"
    >
      <input
        ref={inputRef}
        type="number"
        min={0}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full text-sm border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1",
          isValid ? "border-border focus:ring-blue-400" : "border-red-500 focus:ring-red-400 text-red-600"
        )}
      />
      {/* Fibonacci quick-select chips */}
      <div className="flex flex-wrap gap-1 pt-1">
        {FIBONACCI.map(f => (
          <button
            key={f}
            type="button"
            onMouseDown={e => { e.preventDefault(); setVal(String(f)); }}
            className={cn(
              "w-7 h-6 rounded text-xs font-medium transition-colors",
              Number(val) === f
                ? "bg-blue-500 text-white"
                : "bg-muted hover:bg-muted/70 text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {!isValid && (
        <p className="text-[10px] text-red-500 leading-tight">
          Use: 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89
        </p>
      )}
    </div>,
    document.body
  );
}
