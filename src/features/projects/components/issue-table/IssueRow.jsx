import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown as ChevDown, User, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { issueService } from "@/features/projects/api/issueService";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "../IssueCard";
import { getStatusStyle } from "../../utils/issueStyles";
import InlineTitleEditor from "../inline-editors/InlineTitleEditor";
import InlineDropdown from "../inline-editors/InlineDropdown";
import InlineNumberEditor from "../inline-editors/InlineNumberEditor";
import InlineDateEditor from "../inline-editors/InlineDateEditor";

function Avatar({ name, size = 6 }) {
  const initials = (name || "?")
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function IssueRow({
  issue: initialIssue,
  visibleColumns,
  issueTypes, issuePriorities, workflowStatuses, members, sprints,
  statusMap, typeMap, priorityMap, memberMap, sprintMap, issuesMap,
  projectId,
  onOpenDetail,
  onUpdated,
}) {
  const [issue, setIssue] = useState(initialIssue);
  useEffect(() => { setIssue(initialIssue); }, [initialIssue]);

  const [openField, setOpenField] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const status = statusMap[issue.statusId];
  const type = typeMap[issue.issueTypeId];
  const priority = priorityMap[issue.priorityId];
  const assigneeId = issue.assigneeId || issue.assignee?.id;
  const assignee = memberMap[assigneeId] || issue.assignee;
  const sprint = sprintMap[issue.sprintId];
  const reporter = memberMap[issue.reporterId] || issue.reporter;
  const parent = issue.parentId ? issuesMap[issue.parentId] : null;

  const TypeIcon = getIssueTypeIcon(type?.name);
  const typeColor = getIssueTypeColor(type?.name);
  const { icon: PrioIcon, color: prioColor } = getPriorityIcon(priority?.name);

  const assigneeName = assignee?.fullName || assignee?.userName || assignee?.name || assignee?.email || null;
  const reporterName = reporter?.fullName || reporter?.userName || reporter?.name || reporter?.email || null;

  const toggle = useCallback((e, field) => {
    e.stopPropagation();
    if (openField === field) { setOpenField(null); setAnchorEl(null); }
    else { setOpenField(field); setAnchorEl(e.currentTarget); }
  }, [openField]);

  const close = useCallback(() => { setOpenField(null); setAnchorEl(null); }, []);

  const patch = useCallback(async (update) => {
    const prev = issue;
    setIssue(p => ({ ...p, ...update }));
    setOpenField(null); setAnchorEl(null);
    try {
      // sprint change handled separately
      if ("sprintId" in update) {
        if (update.sprintId) await issueService.moveToSprint(projectId, issue.id, update.sprintId);
        else await issueService.removeFromSprint(projectId, issue.id);
      } else {
        await issueService.updateIssue(projectId, issue.id, update);
      }
      onUpdated?.();
    } catch (e) {
      setIssue(prev);
      toast.error(e?.message || "Error updating issue");
    }
  }, [issue, projectId, onUpdated]);

  // Build option lists
  const statusOptions = workflowStatuses.map(s => ({
    value: s.id, label: s.name, active: s.id === issue.statusId,
    icon: <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />,
  }));
  const priorityOptions = issuePriorities.map(p => {
    const { icon: Icon, color } = getPriorityIcon(p.name);
    return { value: p.id, label: p.name, active: p.id === issue.priorityId, icon: <Icon className={cn("w-3.5 h-3.5", color)} /> };
  });
  const typeOptions = issueTypes.map(it => ({
    value: it.id, label: it.name, active: it.id === issue.issueTypeId,
  }));
  const assigneeOptions = [
    { value: null, label: "Unassigned", active: !issue.assigneeId, icon: <User className="w-3.5 h-3.5 text-muted-foreground" /> },
    ...members.map(m => {
      const name = m.fullName || m.userName || m.name || m.email || "?";
      const id = m.accountId || m.id || m.userId;
      const ini = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      return {
        value: id, label: name, active: id === (issue.assigneeId || issue.assignee?.id),
        icon: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{ini}</div>,
      };
    }),
  ];
  if (issue.assigneeId && !members.some(m => (m.accountId || m.id || m.userId) === issue.assigneeId)) {
    const ini = (assigneeName || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    assigneeOptions.push({
      value: issue.assigneeId, label: assigneeName || "?", active: true,
      icon: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{ini}</div>,
    });
  }
  const sprintOptions = [
    { value: null, label: "Backlog", active: !issue.sprintId },
    ...sprints
      .filter(s => s.status === "PLANNED" || s.status === "ACTIVE")
      .map(s => ({ value: s.id, label: s.name, active: s.id === issue.sprintId })),
  ];

  const isVisible = (col) => visibleColumns.has(col);

  const col = (key, content) => isVisible(key) ? content : null;

  const cellClass = "px-3 py-2 align-middle";

  return (
    <tr className="group hover:bg-muted/40 transition-colors border-b border-border last:border-0">

      {/* KEY + TYPE ICON */}
      {isVisible("key") && (
        <td className={cellClass}>
          <div className="flex items-center gap-1.5">
            <TypeIcon className={`w-3.5 h-3.5 flex-shrink-0 ${typeColor}`} />
            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{issue.issueKey}</span>
            {/* Open detail link on hover */}
            <button
              type="button"
              title="Open detail"
              onClick={e => { e.stopPropagation(); onOpenDetail(issue); }}
              className="ml-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </td>
      )}

      {/* TITLE — inline edit */}
      {isVisible("title") && (
        <td className={cn(cellClass, "max-w-xs")}>
          <button
            type="button"
            className="w-full text-left text-sm font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
            onClick={e => toggle(e, "title")}
            title={issue.title}
          >
            {issue.title || <span className="text-muted-foreground italic text-xs">No title</span>}
          </button>
          {openField === "title" && (
            <InlineTitleEditor
              value={issue.title}
              anchorEl={anchorEl}
              onSave={v => { if (v.trim() && v !== issue.title) patch({ title: v.trim() }); }}
              onClose={close}
            />
          )}
        </td>
      )}

      {/* STATUS — inline dropdown */}
      {isVisible("status") && (
        <td className={cellClass}>
          <button
            type="button"
            onClick={e => toggle(e, "status")}
            className="flex items-center gap-1 w-full text-left rounded hover:bg-muted px-1 py-0.5 transition-colors"
          >
            {status
              ? <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusStyle(status.name)}`}>{status.name}</span>
              : <span className="text-xs text-muted-foreground">—</span>
            }
            <ChevDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
          </button>
          {openField === "status" && (
            <InlineDropdown options={statusOptions} onSelect={v => patch({ statusId: v })} onClose={close} anchorEl={anchorEl} />
          )}
        </td>
      )}

      {/* PRIORITY — inline dropdown */}
      {isVisible("priority") && (
        <td className={cellClass}>
          <button
            type="button"
            onClick={e => toggle(e, "priority")}
            className="flex items-center gap-1.5 w-full text-left rounded hover:bg-muted px-1.5 py-1 transition-colors"
          >
            {priority
              ? <><PrioIcon className={`w-3.5 h-3.5 shrink-0 ${prioColor}`} /><span className="text-xs text-foreground">{priority.name}</span></>
              : <span className="text-xs text-muted-foreground">—</span>
            }
            <ChevDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
          </button>
          {openField === "priority" && (
            <InlineDropdown options={priorityOptions} onSelect={v => patch({ priorityId: v })} onClose={close} anchorEl={anchorEl} />
          )}
        </td>
      )}

      {/* ASSIGNEE — inline dropdown */}
      {isVisible("assignee") && (
        <td className={cellClass}>
          <button
            type="button"
            onClick={e => toggle(e, "assignee")}
            className="flex items-center gap-1.5 w-full text-left rounded hover:bg-muted px-1.5 py-1 transition-colors"
          >
            {assigneeName
              ? <><Avatar name={assigneeName} size={5} /><span className="text-xs text-foreground truncate max-w-[90px]">{assigneeName}</span></>
              : <><User className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Unassigned</span></>
            }
            <ChevDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
          </button>
          {openField === "assignee" && (
            <InlineDropdown options={assigneeOptions} onSelect={v => patch({ assigneeId: v })} onClose={close} anchorEl={anchorEl} />
          )}
        </td>
      )}

      {/* SPRINT — inline dropdown */}
      {isVisible("sprint") && (
        <td className={cellClass}>
          <button
            type="button"
            onClick={e => toggle(e, "sprint")}
            className="flex items-center gap-1 w-full text-left rounded hover:bg-muted px-1.5 py-1 transition-colors"
          >
            <span className={cn("text-xs truncate max-w-[120px]", sprint ? "text-blue-600 dark:text-blue-400 font-medium" : "text-muted-foreground")}>
              {sprint ? sprint.name : "Backlog"}
            </span>
            <ChevDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
          </button>
          {openField === "sprint" && (
            <InlineDropdown options={sprintOptions} onSelect={v => patch({ sprintId: v })} onClose={close} anchorEl={anchorEl} />
          )}
        </td>
      )}

      {/* STORY POINTS — inline number */}
      {isVisible("storyPoints") && (
        <td className={cn(cellClass, "text-center")}>
          <button
            type="button"
            onClick={e => toggle(e, "storyPoints")}
            className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded hover:bg-muted text-xs font-medium text-foreground transition-colors"
          >
            {issue.storyPoints != null ? issue.storyPoints : <span className="text-muted-foreground">—</span>}
          </button>
          {openField === "storyPoints" && (
            <InlineNumberEditor
              value={issue.storyPoints}
              anchorEl={anchorEl}
              onSave={v => patch({ storyPoints: v === "" ? null : parseInt(v, 10) })}
              onClose={close}
            />
          )}
        </td>
      )}

      {/* DUE DATE — inline date picker */}
      {isVisible("dueDate") && (
        <td className={cellClass}>
          <button
            type="button"
            onClick={e => toggle(e, "dueDate")}
            className="flex items-center gap-1 w-full text-left rounded hover:bg-muted px-1.5 py-0.5 transition-colors"
          >
            {issue.dueDate
              ? <span className="text-xs text-foreground">{new Date(issue.dueDate).toLocaleDateString()}</span>
              : <span className="text-xs text-muted-foreground">—</span>
            }
            <ChevDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
          </button>
          {openField === "dueDate" && (
            <InlineDateEditor
              value={issue.dueDate ? issue.dueDate.slice(0, 10) : ""}
              anchorEl={anchorEl}
              onSave={v => patch({ dueDate: v || null })}
              onClose={close}
              createdAt={issue.createdAt}
            />
          )}
        </td>
      )}

      {/* TYPE — inline dropdown */}
      {isVisible("type") && (
        <td className={cellClass}>
          <button
            type="button"
            onClick={e => toggle(e, "type")}
            className="flex items-center gap-1.5 w-full text-left rounded hover:bg-muted px-1.5 py-1 transition-colors"
          >
            <TypeIcon className={`w-3.5 h-3.5 shrink-0 ${typeColor}`} />
            <span className="text-xs text-foreground">{type?.name || "—"}</span>
            <ChevDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
          </button>
          {openField === "type" && (
            <InlineDropdown options={typeOptions} onSelect={v => patch({ issueTypeId: v })} onClose={close} anchorEl={anchorEl} />
          )}
        </td>
      )}

      {/* REPORTER — read only */}
      {isVisible("reporter") && (
        <td className={cellClass}>
          {reporterName
            ? <div className="flex items-center gap-1.5"><Avatar name={reporterName} size={5} /><span className="text-xs text-foreground truncate max-w-[90px]">{reporterName}</span></div>
            : <span className="text-xs text-muted-foreground">—</span>
          }
        </td>
      )}

      {/* PARENT — read only */}
      {isVisible("parent") && (
        <td className={cellClass}>
          {parent
            ? <span className="text-xs text-muted-foreground font-mono">{parent.issueKey}</span>
            : <span className="text-xs text-muted-foreground">—</span>
          }
        </td>
      )}
    </tr>
  );
}
