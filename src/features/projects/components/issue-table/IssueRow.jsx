import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown as ChevDown, User, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { issueService } from "@/features/projects/api/issueService";
import Avatar from "@/components/ui/Avatar";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "../IssueCard";
import { getStatusStyle } from "../../utils/issueStyles";
import InlineTitleEditor from "../inline-editors/InlineTitleEditor";
import InlineDropdown from "../inline-editors/InlineDropdown";
import InlineNumberEditor from "../inline-editors/InlineNumberEditor";
import InlineDateEditor from "../inline-editors/InlineDateEditor";

const resolveMemberId = (member) =>
  member?.accountId ||
  member?.userId ||
  member?.user?.accountId ||
  member?.user?.id ||
  member?.id;

const resolveIssueAssigneeId = (issue) =>
  issue?.assigneeId ||
  issue?.assignee?.accountId ||
  issue?.assignee?.userId ||
  issue?.assignee?.user?.accountId ||
  issue?.assignee?.user?.id ||
  issue?.assignee?.id;

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
  const assigneeId = resolveIssueAssigneeId(issue);
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
    const optimistic = { ...issue, ...update };
    setIssue(optimistic);
    setOpenField(null); setAnchorEl(null);
    try {
      let saved = null;
      // sprint change handled separately
      if ("sprintId" in update) {
        if (update.sprintId) {
          saved = await issueService.moveToSprint(projectId, issue.id, update.sprintId);
        } else {
          saved = await issueService.removeFromSprint(projectId, issue.id);
        }
      } else {
        saved = await issueService.updateIssue(projectId, issue.id, update);
      }

      const nextIssue = saved && saved.id ? { ...optimistic, ...saved } : optimistic;
      setIssue(nextIssue);
      onUpdated?.(nextIssue);
    } catch (e) {
      setIssue(prev);
      toast.error(e?.message || "Error updating issue");
    }
  }, [issue, projectId, onUpdated]);

  // Build option lists
  const statusOptions = workflowStatuses.map(s => ({
    value: s.id,
    label: (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusStyle(s.name)}`}>
        {s.name}
      </span>
    ),
    active: s.id === issue.statusId,
  }));
  const priorityOptions = issuePriorities.map(p => {
    const { icon: Icon, color } = getPriorityIcon(p.name);
    return { value: p.id, label: p.name, active: p.id === issue.priorityId, icon: <Icon className={cn("w-3.5 h-3.5", color)} /> };
  });
  const typeOptions = issueTypes.map(it => {
    const OptionTypeIcon = getIssueTypeIcon(it?.name);
    const optionTypeColor = getIssueTypeColor(it?.name);
    return {
      value: it.id,
      label: it.name,
      active: it.id === issue.issueTypeId,
      icon: <OptionTypeIcon className={cn("w-3.5 h-3.5", optionTypeColor)} />,
    };
  });
  const assigneeOptions = [
    { value: null, label: "Unassigned", active: !assigneeId, icon: <User className="w-3.5 h-3.5 text-muted-foreground" /> },
    ...members.map(m => {
      const name = m.fullName || m.userName || m.name || m.email || "?";
      const id = resolveMemberId(m);
      return {
        value: id,
        label: name,
        active: String(id || "") === String(assigneeId || ""),
        icon: <Avatar user={m} name={name} size="xs" />,
      };
    }),
  ];
  if (assigneeId && !members.some(m => String(resolveMemberId(m) || "") === String(assigneeId))) {
    assigneeOptions.push({
      value: assigneeId,
      label: assigneeName || "?",
      active: true,
      icon: <Avatar user={assignee} name={assigneeName || "?"} size="xs" />,
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
        <td className={cn(cellClass, "min-w-[100px]")}>
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
        <td className={cn(cellClass, "min-w-[280px] max-w-xs")}>
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
        <td className={cn(cellClass, "whitespace-nowrap min-w-[140px]")}>
          <button
            type="button"
            onClick={e => toggle(e, "status")}
            className="flex items-center gap-1 w-full text-left rounded hover:bg-muted px-1 py-0.5 transition-colors whitespace-nowrap"
          >
            {status
              ? <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusStyle(status.name)}`}>{status.name}</span>
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
        <td className={cn(cellClass, "min-w-[120px]")}>
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
        <td className={cn(cellClass, "min-w-[150px]")}>
          <button
            type="button"
            onClick={e => toggle(e, "assignee")}
            className="flex items-center gap-1.5 w-full text-left rounded hover:bg-muted px-1.5 py-1 transition-colors"
          >
            {assigneeName
              ? <><Avatar user={assignee} name={assigneeName} size="xs" /><span className="text-xs text-foreground truncate max-w-[90px]">{assigneeName}</span></>
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
        <td className={cn(cellClass, "min-w-[140px]")}>
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
        <td className={cn(cellClass, "text-center min-w-[70px]")}>
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
        <td className={cn(cellClass, "min-w-[120px]")}>
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
        <td className={cn(cellClass, "min-w-[120px]")}>
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
        <td className={cn(cellClass, "min-w-[140px]")}>
          {reporterName
            ? <div className="flex items-center gap-1.5"><Avatar user={reporter} name={reporterName} size="xs" /><span className="text-xs text-foreground truncate max-w-[90px]">{reporterName}</span></div>
            : <span className="text-xs text-muted-foreground">—</span>
          }
        </td>
      )}

      {/* PARENT — read only */}
      {isVisible("parent") && (
        <td className={cn(cellClass, "min-w-[110px]")}>
          {parent
            ? <span className="text-xs text-muted-foreground font-mono">{parent.issueKey}</span>
            : <span className="text-xs text-muted-foreground">—</span>
          }
        </td>
      )}
    </tr>
  );
}
