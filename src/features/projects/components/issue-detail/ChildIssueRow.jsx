import React, { useState, useEffect } from "react";
import { ChevronDown, User, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { issueService } from "@/features/projects/api/issueService";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "../IssueCard";
import { getStatusStyle } from "../../utils/issueStyles";
import InlineDropdown from "../inline-editors/InlineDropdown";

export default function ChildIssueRow({ child, issueTypes, issuePriorities, workflowStatuses, members, projectId, onOpenDetail }) {
  const [openField, setOpenField] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [local, setLocal] = useState(child);
  useEffect(() => setLocal(child), [child]);

  const cp = issuePriorities.find(p => p.id === local.priorityId);
  const ca = members.find(m => (m.accountId || m.id) === local.assigneeId) || local.assignee;
  const caName = ca?.fullName || ca?.userName || ca?.name || ca?.email || null;
  const { icon: CPI, color: cpc } = getPriorityIcon(cp?.name);
  const childTypeName = issueTypes.find(it => it.id === local.issueTypeId)?.name || "TASK";
  const ChildIcon = getIssueTypeIcon(childTypeName);
  const childTypeColor = getIssueTypeColor(childTypeName);

  const handleFieldUpdate = async (patch) => {
    const prev = { ...local };
    setLocal(p => ({ ...p, ...patch }));
    setOpenField(null); setAnchorEl(null);
    try {
      await issueService.updateIssue(projectId, local.id, patch);
    } catch (e) {
      setLocal(prev);
      toast.error(e?.message || "Error updating subtask");
    }
  };

  const toggle = (e, field) => {
    e.stopPropagation();
    if (openField === field) { setOpenField(null); setAnchorEl(null); }
    else { setOpenField(field); setAnchorEl(e.currentTarget); }
  };
  const closeField = () => { setOpenField(null); setAnchorEl(null); };

  const statusOptions = workflowStatuses.map(s => ({
    value: s.id, label: s.name, active: s.id === local.statusId,
    icon: <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />,
  }));

  const priorityOptions = issuePriorities.map(p => {
    const { icon: Icon, color } = getPriorityIcon(p.name);
    return { value: p.id, label: p.name, active: p.id === local.priorityId, icon: <Icon className={cn("w-3.5 h-3.5", color)} /> };
  });

  const caInitials = caName ? caName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : null;
  const assigneeOptions = [
    { value: null, label: "Unassigned", active: !local.assigneeId, icon: <User className="w-3.5 h-3.5 text-muted-foreground" /> },
    ...members.map(m => {
      const name = m.fullName || m.userName || m.name || m.email || "?";
      const id = m.accountId || m.id;
      const ini = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      return {
        value: id, label: name, active: id === local.assigneeId,
        icon: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{ini}</div>
      };
    }),
  ];
  if (local.assigneeId && !members.some(m => (m.accountId || m.id) === local.assigneeId)) {
    assigneeOptions.push({
      value: local.assigneeId, label: caName || "?", active: true,
      icon: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{caInitials || "?"}</div>
    });
  }

  const cs = workflowStatuses.find(s => s.id === local.statusId);

  return (
    <tr className="group hover:bg-muted/40 transition-colors">
      {/* Work */}
      <td className="px-2 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-cyan-100 dark:bg-cyan-900/30 shrink-0">
            <ChildIcon className={cn("w-3.5 h-3.5", childTypeColor)} />
          </span>
          <span className="text-xs font-mono text-muted-foreground shrink-0">{local.issueKey}</span>
          <span className="text-sm text-foreground truncate">{local.title}</span>
          <button type="button" title="Open detail" onClick={() => onOpenDetail(child)}
            className="ml-auto p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-70 transition-opacity shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>

      {/* Priority */}
      <td className="px-1 py-2 w-24">
        <button type="button" onClick={e => toggle(e, "priority")}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 rounded hover:bg-muted transition-colors">
          <CPI className={cn("w-3.5 h-3.5 shrink-0", cpc)} />
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">{cp?.name || "—"}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
        {openField === "priority" && (
          <InlineDropdown options={priorityOptions} onSelect={val => handleFieldUpdate({ priorityId: val })} onClose={closeField} anchorEl={anchorEl} />
        )}
      </td>

      {/* Assignee */}
      <td className="px-1 py-2 w-28">
        <button type="button" onClick={e => toggle(e, "assignee")}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 rounded hover:bg-muted transition-colors">
          {caInitials
            ? <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{caInitials}</div>
            : <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <span className="text-xs text-foreground hidden sm:inline truncate">
            {caName ? caName.split(" ")[0] : <span className="text-muted-foreground">—</span>}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
        {openField === "assignee" && (
          <InlineDropdown options={assigneeOptions} onSelect={val => handleFieldUpdate({ assigneeId: val })} onClose={closeField} anchorEl={anchorEl} />
        )}
      </td>

      {/* Status */}
      <td className="px-1 py-2 w-32">
        <button type="button" onClick={e => toggle(e, "status")}
          className="flex items-center gap-1 w-full px-1 py-0.5 rounded hover:bg-muted transition-colors">
          {cs
            ? <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusStyle(cs.name)}`}>{cs.name}</span>
            : <span className="text-xs text-muted-foreground px-1">—</span>}
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
        </button>
        {openField === "status" && (
          <InlineDropdown options={statusOptions} onSelect={val => handleFieldUpdate({ statusId: val })} onClose={closeField} anchorEl={anchorEl} />
        )}
      </td>
    </tr>
  );
}
