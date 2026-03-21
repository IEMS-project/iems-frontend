import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function CollapsibleSection({ title, collapsed, onToggle, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-blue-500 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
          {title}
        </button>
        {action}
      </div>
      {!collapsed && children}
    </div>
  );
}
