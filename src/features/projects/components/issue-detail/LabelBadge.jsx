import React from "react";
import { X } from "lucide-react";

export default function LabelBadge({ label, onRemove, className = "" }) {
  const { name, color } = label;
  
  // Calculate if we should use dark or light text based on background color
  const isDark = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness < 155;
  };

  const textColor = isDark(color) ? "text-white" : "text-gray-900";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm transition-all hover:scale-105 ${textColor} ${className}`}
      style={{ backgroundColor: color }}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label.id);
          }}
          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
