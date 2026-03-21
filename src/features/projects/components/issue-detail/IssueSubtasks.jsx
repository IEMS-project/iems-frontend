import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Check,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "../IssueCard";
import Avatar from "@/components/ui/Avatar";
import { issueService } from "@/features/projects/api/issueService";
import IssueDetailModal from "../IssueDetailModal";

function StatusPill({ statusName = "", color }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={
        color
          ? {
              backgroundColor: color + "22",
              color: color,
              border: `1px solid ${color}44`,
            }
          : {}
      }
    >
      {statusName}
    </span>
  );
}

/* ── Portaled dropdown — renders into body to escape overflow clipping ── */
function InlineDropdown({ options, onSelect, onClose, anchorEl }) {
  const ref = useRef(null);

  useEffect(() => {
    function onMD(e) {
      if (
        ref.current && !ref.current.contains(e.target) &&
        anchorEl && !anchorEl.contains(e.target)
      ) onClose();
    }
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onMD);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMD);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, anchorEl]);

  const rect = anchorEl?.getBoundingClientRect();
  if (!rect) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 160),
        zIndex: 9999,
      }}
      className="max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-lg py-1"
    >
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className="w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-muted text-foreground transition-colors text-left"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(opt.value);
          }}
        >
          {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
          <span className="truncate">{opt.label}</span>
          {opt.active && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-blue-600" />}
        </button>
      ))}
    </div>,
    document.body
  );
}

/* ── Single subtask row with inline editable cells ── */
function SubtaskRow({
  subtask,
  issueTypes,
  issuePriorities,
  workflowStatuses,
  members,
  projectId,
  onNavigate,
}) {
  const [openField, setOpenField] = useState(null); // 'priority' | 'assignee' | 'status' | null
  const [anchorEl, setAnchorEl] = useState(null);
  const [local, setLocal] = useState(subtask);

  // Sync if parent refreshes data
  useEffect(() => setLocal(subtask), [subtask]);

  const typeName = issueTypes.find((t) => t.id === local.issueTypeId)?.name || "SUBTASK";
  const TypeIcon = getIssueTypeIcon(typeName);
  const typeColor = getIssueTypeColor(typeName);

  const priorityObj = issuePriorities.find((p) => p.id === local.priorityId);
  const { icon: PriorityIcon, color: prioColor } = getPriorityIcon(priorityObj?.name);

  const statusObj = workflowStatuses.find((s) => s.id === local.statusId);

  const assignee = members.find((m) => (m.accountId || m.id) === local.assigneeId) || local.assignee;
  const assigneeName = assignee?.fullName || assignee?.userName || assignee?.name || assignee?.email || null;

  const toggleField = (e, field) => {
    e.stopPropagation();
    if (openField === field) {
      setOpenField(null);
      setAnchorEl(null);
    } else {
      setOpenField(field);
      setAnchorEl(e.currentTarget);
    }
  };

  const closeField = () => { setOpenField(null); setAnchorEl(null); };

  const handleFieldUpdate = async (patch) => {
    const prev = { ...local };
    setLocal((p) => ({ ...p, ...patch }));
    closeField();
    try {
      await issueService.updateIssue(projectId, local.id, patch);
    } catch (e) {
      setLocal(prev);
      toast.error(e?.message || "Error updating subtask");
    }
  };

  /* option lists */
  const priorityOptions = issuePriorities.map((p) => {
    const { icon: Icon, color } = getPriorityIcon(p.name);
    return {
      value: p.id,
      label: p.name,
      active: p.id === local.priorityId,
      icon: <Icon className={cn("w-3.5 h-3.5", color)} />,
    };
  });

  const statusOptions = workflowStatuses.map((s) => ({
    value: s.id,
    label: s.name,
    active: s.id === local.statusId,
    icon: (
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: s.color }}
      />
    ),
  }));

  const assigneeOptions = [
    {
      value: null,
      label: "Unassigned",
      active: !local.assigneeId,
      icon: <User className="w-3.5 h-3.5 text-muted-foreground" />,
    },
    ...members.map((m) => {
      const name = m.fullName || m.userName || m.name || m.email || "?";
      const id = m.accountId || m.id;
      return {
        value: id,
        label: name,
        active: id === local.assigneeId,
        icon: <Avatar name={name} size="xs" />,
      };
    }),
  ];

  if (local.assigneeId && !members.some((m) => (m.accountId || m.id) === local.assigneeId)) {
    assigneeOptions.push({
      value: local.assigneeId,
      label: assigneeName || "?",
      active: true,
      icon: <Avatar name={assigneeName || "?"} size="xs" />,
    });
  }

  return (
    <tr className="group hover:bg-muted/40 transition-colors">
      {/* Work */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "inline-flex items-center justify-center w-5 h-5 rounded flex-shrink-0",
              "bg-cyan-100 dark:bg-cyan-900/30"
            )}
          >
            <TypeIcon className={cn("w-3.5 h-3.5", typeColor)} />
          </span>
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
            {local.issueKey}
          </span>
          <span className="text-sm text-foreground truncate">{local.title}</span>
          <button
            type="button"
            title="Open detail"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(subtask);
            }}
            className="ml-auto flex-shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-70 transition-opacity"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>

      {/* Priority */}
      <td className="px-2 py-2 w-28">
        <button
          type="button"
          onClick={(e) => toggleField(e, "priority")}
          className="flex items-center gap-1.5 w-full rounded px-1.5 py-1 hover:bg-muted transition-colors"
        >
          <PriorityIcon className={cn("w-3.5 h-3.5 flex-shrink-0", prioColor)} />
          <span className="text-xs text-muted-foreground hidden sm:inline truncate">
            {priorityObj?.name || "—"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 flex-shrink-0" />
        </button>
        {openField === "priority" && (
          <InlineDropdown
            options={priorityOptions}
            onSelect={(val) => handleFieldUpdate({ priorityId: val })}
            onClose={closeField}
            anchorEl={anchorEl}
          />
        )}
      </td>

      {/* Assignee */}
      <td className="px-2 py-2 w-32">
        <button
          type="button"
          onClick={(e) => toggleField(e, "assignee")}
          className="flex items-center gap-1.5 w-full rounded px-1.5 py-1 hover:bg-muted transition-colors"
        >
          {assigneeName ? (
            <>
              <Avatar name={assigneeName} size="xs" />
              <span className="text-xs text-foreground hidden sm:inline truncate">
                {assigneeName.split(" ")[0]}
              </span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground hidden sm:inline">—</span>
            </>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 flex-shrink-0" />
        </button>
        {openField === "assignee" && (
          <InlineDropdown
            options={assigneeOptions}
            onSelect={(val) => handleFieldUpdate({ assigneeId: val })}
            onClose={closeField}
            anchorEl={anchorEl}
          />
        )}
      </td>

      {/* Status */}
      <td className="px-2 py-2 w-36">
        <button
          type="button"
          onClick={(e) => toggleField(e, "status")}
          className="flex items-center gap-1 w-full rounded px-1 py-0.5 hover:bg-muted transition-colors"
        >
          {statusObj ? (
            <StatusPill statusName={statusObj.name} color={statusObj.color} />
          ) : (
            <span className="text-xs text-muted-foreground px-1">—</span>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 flex-shrink-0" />
        </button>
        {openField === "status" && (
          <InlineDropdown
            options={statusOptions}
            onSelect={(val) => handleFieldUpdate({ statusId: val })}
            onClose={closeField}
            anchorEl={anchorEl}
          />
        )}
      </td>
    </tr>
  );
}

export default function IssueSubtasks({
  subtasks = [],
  issueTypes = [],
  issuePriorities = [],
  workflowStatuses = [],
  members = [],
  projectId,
  onRefresh,
}) {
  const { projectId: paramProjectId } = useParams();
  const pid = projectId || paramProjectId;

  const [collapsed, setCollapsed] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState(null);

  if (!subtasks || subtasks.length === 0) return null;

  const doneCount = subtasks.filter((s) => {
    const status = workflowStatuses.find((ws) => ws.id === s.statusId);
    return (
      status?.name?.toUpperCase().includes("DONE") ||
      status?.name?.toUpperCase().includes("CLOSED") ||
      status?.name?.toUpperCase().includes("RESOLVED")
    );
  }).length;

  const progress =
    subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const handleNavigate = (subtask) => {
    setSelectedSubtask(subtask);
  };

  return (
    <>
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-foreground">Child Issues</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {subtasks.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {doneCount}/{subtasks.length}
              </span>
            </div>
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Future: open create subtask modal
            }}
            className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-border bg-muted/30">
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Work
                </th>
                <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                  Priority
                </th>
                <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">
                  Assignee
                </th>
                <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-36">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {subtasks.map((subtask) => (
                <SubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  issueTypes={issueTypes}
                  issuePriorities={issuePriorities}
                  workflowStatuses={workflowStatuses}
                  members={members}
                  projectId={pid}
                  onNavigate={handleNavigate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>

    {selectedSubtask && (
      <IssueDetailModal
        open={!!selectedSubtask}
        onClose={() => setSelectedSubtask(null)}
        issue={selectedSubtask}
        onUpdate={() => { onRefresh?.(); setSelectedSubtask(null); }}
        onDelete={() => { onRefresh?.(); setSelectedSubtask(null); }}
      />
    )}
    </>
  );
}
