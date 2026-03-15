import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

/* ── View-only rendered HTML ── */
function DescriptionView({ html, onStartEdit }) {
  const isEmpty = !html || html.trim() === "" || html === "<p><br></p>";
  return (
    <div
      className="cursor-pointer rounded-md p-2 -mx-2 hover:bg-muted/40 transition-colors min-h-[40px]"
      onClick={onStartEdit}
      title="Nhấn để chỉnh sửa"
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic select-none">
          Nhập mô tả…
        </p>
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground leading-relaxed select-none pointer-events-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

export default function IssueDescription({ description = "", onSave }) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  const handleStartEdit = () => {
    setDraft(description ?? "");
    setEditing(true);
    setCollapsed(false);
  };

  const handleSave = () => {
    const cleaned = draft === "<p><br></p>" ? "" : draft;
    onSave?.(cleaned || null);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(description ?? "");
    setEditing(false);
  };

  return (
    <section className="rounded-lg border border-border bg-card">
      {/* Section header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => !editing && setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold text-foreground">
            Description
          </span>
        </div>
        {!editing && !collapsed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStartEdit();
            }}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-4">
          {editing ? (
            <div className="space-y-3">
              {/* Quill rich text editor */}
              <RichTextEditor
                value={draft}
                onChange={setDraft}
                placeholder="Nhập mô tả…"
              />

              {/* Save / Cancel */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <DescriptionView html={description} onStartEdit={handleStartEdit} />
          )}
        </div>
      )}
    </section>
  );
}
