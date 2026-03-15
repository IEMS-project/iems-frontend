import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  CheckCircle2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { getIssueTypeIcon, getIssueTypeColor } from "../IssueCard";

// Status → badge variant + label
function getStatusVariant(statusName = "") {
  const n = statusName.toUpperCase();
  if (n.includes("DONE") || n.includes("CLOSED") || n.includes("RESOLVED")) return "success";
  if (n.includes("PROGRESS") || n.includes("REVIEW") || n.includes("TESTING")) return "blue";
  if (n.includes("BLOCKED") || n.includes("BUG")) return "red";
  if (n.includes("TODO") || n.includes("OPEN") || n.includes("BACKLOG")) return "gray";
  return "gray";
}

export default function IssueHeader({
  issue,
  issueTypes = [],
  issuePriorities = [],
  workflowStatuses = [],
  onUpdate,
  onDelete,
  saving = false,
}) {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(issue?.title || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setTitleDraft(issue?.title || "");
  }, [issue?.title]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== issue.title) {
      onUpdate?.({ title: trimmed });
    } else {
      setTitleDraft(issue.title);
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") {
      setTitleDraft(issue.title);
      setEditingTitle(false);
    }
  };

  const handleStatusChange = (e) => {
    const statusId = e.target.value;
    if (statusId !== issue.statusId) {
      onUpdate?.({ statusId });
    }
  };

  const typeName = issueTypes.find((t) => t.id === issue?.issueTypeId)?.name || "TASK";
  const TypeIcon = getIssueTypeIcon(typeName);
  const typeColor = getIssueTypeColor(typeName);
  const currentStatus = workflowStatuses.find((s) => s.id === issue?.statusId);
  const statusVariant = getStatusVariant(currentStatus?.name || "");

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <button
          onClick={() => navigate(`/projects/${projectId}/tasks`)}
          className="hover:text-foreground hover:underline transition-colors"
        >
          Issues
        </button>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="flex items-center gap-1">
          <TypeIcon className={cn("w-3 h-3", typeColor)} />
          <span className="font-mono font-medium text-foreground">{issue.issueKey}</span>
        </span>
      </div>

      {/* Title row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                ref={titleRef}
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="flex-1 text-2xl font-bold bg-transparent text-foreground border-b-2 border-blue-500 focus:outline-none py-0.5 pr-2"
              />
              <button
                onClick={handleTitleSave}
                className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTitleDraft(issue.title);
                  setEditingTitle(false);
                }}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold text-foreground leading-tight cursor-pointer hover:text-muted-foreground transition-colors group"
              onClick={() => setEditingTitle(true)}
              title="Click to edit"
            >
              {issue.title}
              <Pencil className="inline-block ml-2 w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
            </h1>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <button
            onClick={() => setEditingTitle(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-muted text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>

          {/* More actions */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 z-50 w-44 rounded-lg border border-border bg-background shadow-lg py-1">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(issue.issueKey);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy issue key
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Copy link
                </button>
                <hr className="my-1 border-border" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete issue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status select */}
        <div className="relative">
          <select
            value={issue.statusId || ""}
            onChange={handleStatusChange}
            className={cn(
              "appearance-none rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "bg-muted text-foreground border-border"
            )}
            style={
              currentStatus?.color
                ? {
                    backgroundColor: currentStatus.color + "22",
                    borderColor: currentStatus.color + "66",
                    color: currentStatus.color,
                  }
                : {}
            }
          >
            {workflowStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type badge */}
        <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-medium">
          <TypeIcon className={cn("w-3.5 h-3.5", typeColor)} />
          {typeName}
        </span>

        {/* Issue key badge */}
        <span className="inline-flex items-center text-xs font-mono bg-muted text-muted-foreground rounded-full px-2.5 py-1">
          {issue.issueKey}
        </span>

        {saving && (
          <span className="text-xs text-muted-foreground italic animate-pulse">Saving…</span>
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl shadow-2xl border border-border p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-foreground mb-2">Delete Issue?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently delete <strong>{issue.issueKey}</strong> and cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete?.();
                }}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
