import React from "react";
import { User, Flag, Layers, Zap, Hash, Calendar, CalendarDays } from "lucide-react";
import FibonacciStoryPointInput from "../FibonacciStoryPointInput";
import { todayStr } from "@/features/projects/utils/dateValidation";
import IssueAvatar from "./IssueAvatar";

function DetailField({ label, icon: Icon, children: content }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-1 py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}{label}
      </div>
      <div>{content}</div>
    </div>
  );
}

export default function IssueSidebar({
  form,
  onChangeField,
  issue,
  members,
  issuePriorities,
  issueTypes,
  sprints,
  assigneeName,
  reporterName
}) {
  const selectClass = "w-full rounded-md border border-border bg-background text-foreground px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div className="p-5 space-y-0">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Details</p>

      {/* Assignee */}
      <DetailField label="Assignee" icon={User}>
        <div className="space-y-1.5">
          {assigneeName ? (
            <div className="flex items-center gap-2 mb-1">
              <IssueAvatar name={assigneeName} />
              <span className="text-sm text-foreground">{assigneeName}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic mb-1">Unassigned</p>
          )}
          <select value={form.assigneeId || ""} onChange={e => onChangeField("assigneeId", e.target.value)} className={selectClass}>
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.accountId || m.id} value={m.accountId || m.id}>
                {m.fullName || m.userName || m.name || m.email || m.accountId}
              </option>
            ))}
            {form.assigneeId && !members.some(m => (m.accountId || m.id) === form.assigneeId) && (
              <option key={form.assigneeId} value={form.assigneeId}>
                {assigneeName || form.assigneeId}
              </option>
            )}
          </select>
        </div>
      </DetailField>

      {/* Reporter */}
      {reporterName && (
        <DetailField label="Reporter" icon={User}>
          <div className="flex items-center gap-2 pt-1">
            <IssueAvatar name={reporterName} color="bg-green-500" />
            <span className="text-sm text-foreground">{reporterName}</span>
          </div>
        </DetailField>
      )}

      {/* Priority */}
      <DetailField label="Priority" icon={Flag}>
        <select value={form.priorityId || ""} onChange={e => onChangeField("priorityId", e.target.value)} className={selectClass}>
          <option value="">None</option>
          {issuePriorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </DetailField>

      {/* Type */}
      <DetailField label="Type" icon={Layers}>
        <select value={form.issueTypeId || ""} onChange={e => onChangeField("issueTypeId", e.target.value)} className={selectClass}>
          {issueTypes.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
        </select>
      </DetailField>

      {/* Sprint */}
      <DetailField label="Sprint" icon={Zap}>
        <select value={form.sprintId || ""} onChange={e => onChangeField("sprintId", e.target.value)} className={selectClass}>
          <option value="">Backlog</option>
          {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </DetailField>

      {/* Story Points */}
      <DetailField label="Story Points" icon={Hash}>
        <FibonacciStoryPointInput
          value={form.storyPoints}
          onChange={v => onChangeField("storyPoints", v)}
          placeholder="—"
          className={selectClass}
        />
      </DetailField>

      {/* Due Date */}
      <DetailField label="Due date" icon={Calendar}>
        <input
          type="date"
          min={todayStr()}
          value={form.dueDate || ""}
          onChange={e => onChangeField("dueDate", e.target.value)}
          className={selectClass}
        />
      </DetailField>

      {/* Created / Updated */}
      {issue?.createdAt && (
        <DetailField label="Created" icon={CalendarDays}>
          <p className="text-sm text-foreground pt-1">{new Date(issue.createdAt).toLocaleDateString()}</p>
        </DetailField>
      )}
      {issue?.updatedAt && (
        <DetailField label="Updated" icon={CalendarDays}>
          <p className="text-sm text-foreground pt-1">{new Date(issue.updatedAt).toLocaleDateString()}</p>
        </DetailField>
      )}
    </div>
  );
}
