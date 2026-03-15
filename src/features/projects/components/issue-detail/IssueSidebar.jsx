import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  User,
  Flag,
  CalendarDays,
  Hash,
  Zap,
  Layers,
  UserCheck,
  Calendar,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Bot,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "../IssueCard";

/* ── Collapsible sidebar section ── */
function SidebarSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        {title}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Single detail field ── */
function DetailField({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        {label}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

/* ── Inline select ── */
function InlineSelect({ value, onChange, options, placeholder = "—" }) {
  return (
    <select
      value={value || ""}
      onChange={onChange}
      className={cn(
        "w-full rounded-md border border-border bg-background text-foreground",
        "px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function IssueSidebar({
  issue,
  issueTypes = [],
  issuePriorities = [],
  workflowStatuses = [],
  members = [],
  sprints = [],
  onUpdate,
}) {
  /* ── Derive display values ── */
  const typeName = issueTypes.find((t) => t.id === issue?.issueTypeId)?.name || "TASK";
  const TypeIcon = getIssueTypeIcon(typeName);
  const typeColor = getIssueTypeColor(typeName);

  const priorityObj = issuePriorities.find((p) => p.id === issue?.priorityId);
  const { icon: PriorityIcon, color: prioColor } = getPriorityIcon(priorityObj?.name);

  const sprintObj = sprints.find((s) => s.id === issue?.sprintId);
  // Use enriched user data from API response; fall back to member list lookup (correct field: userId)
  const assigneeName =
    issue?.assignee?.name ??
    members.find((m) => m.userId === issue?.assigneeId)?.userName ??
    null;
  const assigneeEmail = issue?.assignee?.email ?? null;
  const reporterName =
    issue?.reporter?.name ??
    members.find((m) => m.userId === issue?.reporterId)?.userName ??
    null;
  const reporterEmail = issue?.reporter?.email ?? null;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null);

  /* ── Field update helpers ── */
  const handleAssigneeChange = (e) => onUpdate?.({ assigneeId: e.target.value || null });
  const handlePriorityChange = (e) => onUpdate?.({ priorityId: e.target.value || null });
  const handleTypeChange = (e) => onUpdate?.({ issueTypeId: e.target.value });
  const handleSprintChange = (e) => onUpdate?.({ sprintId: e.target.value || null });
  const handleDueDateChange = (e) => onUpdate?.({ dueDate: e.target.value || null });
  const handleStoryPointsChange = (e) => {
    const v = e.target.value;
    onUpdate?.({ storyPoints: v === "" ? null : parseInt(v, 10) });
  };

  /* ── Check if development/automation sections should show ── */
  const hasDevelopment = !!(issue?.branches?.length || issue?.commits?.length || issue?.pullRequests?.length);
  const hasAutomation = !!(issue?.ruleExecutions?.length || issue?.automationLogs?.length);

  return (
    <aside
      className={cn(
        "w-[300px] flex-shrink-0 border-l border-border bg-card",
        "overflow-y-auto"
      )}
    >
      {/* ── DETAILS ── */}
      <SidebarSection title="Details" icon={Layers}>
        {/* Assignee — always show (assignable) */}
        <DetailField label="Assignee" icon={User}>
          <div className="space-y-1.5">
            {assigneeName ? (
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar name={assigneeName} size="xs" />
                <div>
                  <p className="text-sm">{assigneeName}</p>
                  {assigneeEmail && (
                    <p className="text-xs text-muted-foreground">{assigneeEmail}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic text-sm">Unassigned</p>
            )}
            <InlineSelect
              value={issue?.assigneeId}
              onChange={handleAssigneeChange}
              placeholder="Unassigned"
              options={members.map((m) => ({
                value: m.userId,
                label: m.userName
                  ? `${m.userName}${m.userEmail ? ` (${m.userEmail})` : ""}`
                  : m.userEmail || String(m.userId),
              }))}
            />
          </div>
        </DetailField>

        {/* Reporter — only show if exists */}
        {reporterName && (
          <DetailField label="Reporter" icon={UserCheck}>
            <div className="flex items-center gap-2">
              <Avatar name={reporterName} size="xs" />
              <div>
                <p className="text-sm">{reporterName}</p>
                {reporterEmail && (
                  <p className="text-xs text-muted-foreground">{reporterEmail}</p>
                )}
              </div>
            </div>
          </DetailField>
        )}

        {/* Priority — always show (editable) */}
        <DetailField label="Priority" icon={Flag}>
          <div className="space-y-1.5">
            {priorityObj && (
              <div className="flex items-center gap-1.5 mb-1">
                <PriorityIcon className={cn("w-4 h-4", prioColor)} />
                <span>{priorityObj.name}</span>
              </div>
            )}
            <InlineSelect
              value={issue?.priorityId}
              onChange={handlePriorityChange}
              placeholder="No priority"
              options={issuePriorities.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
        </DetailField>

        {/* Type */}
        <DetailField label="Type" icon={Layers}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TypeIcon className={cn("w-4 h-4", typeColor)} />
              <span>{typeName}</span>
            </div>
            <InlineSelect
              value={issue?.issueTypeId}
              onChange={handleTypeChange}
              placeholder="Select type"
              options={issueTypes.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>
        </DetailField>

        {/* Sprint — show if sprints available */}
        {sprints.length > 0 && (
          <DetailField label="Sprint" icon={Zap}>
            <div className="space-y-1.5">
              {sprintObj && <p className="text-sm font-medium">{sprintObj.name}</p>}
              <InlineSelect
                value={issue?.sprintId}
                onChange={handleSprintChange}
                placeholder="No sprint (Backlog)"
                options={sprints.map((s) => ({ value: s.id, label: s.name }))}
              />
            </div>
          </DetailField>
        )}

        {/* Story Points — show if value exists */}
        {issue?.storyPoints != null && (
          <DetailField label="Story Points" icon={Hash}>
            <input
              type="number"
              min={0}
              defaultValue={issue.storyPoints}
              onBlur={handleStoryPointsChange}
              className={cn(
                "w-full rounded-md border border-border bg-background text-foreground",
                "px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
          </DetailField>
        )}

        {/* Due Date — show if value exists */}
        {issue?.dueDate && (
          <DetailField label="Due Date" icon={Calendar}>
            <input
              type="date"
              defaultValue={issue.dueDate?.split("T")[0] || ""}
              onBlur={handleDueDateChange}
              className={cn(
                "w-full rounded-md border border-border bg-background text-foreground",
                "px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
          </DetailField>
        )}

        {/* Timestamps */}
        {(issue?.createdAt || issue?.updatedAt) && (
          <div className="pt-1 space-y-1.5 border-t border-border">
            {issue?.createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Created {formatDate(issue.createdAt)}</span>
              </div>
            )}
            {issue?.updatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Updated {formatDate(issue.updatedAt)}</span>
              </div>
            )}
          </div>
        )}
      </SidebarSection>

      {/* ── DEVELOPMENT — only show if data exists ── */}
      {hasDevelopment && (
        <SidebarSection title="Development" icon={GitBranch} defaultOpen={false}>
          {issue?.branches?.length > 0 && (
            <DetailField label="Branches" icon={GitBranch}>
              <div className="space-y-1">
                {issue.branches.map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono text-xs truncate">{b.name || b}</span>
                  </div>
                ))}
              </div>
            </DetailField>
          )}
          {issue?.commits?.length > 0 && (
            <DetailField label="Commits" icon={GitCommit}>
              <div className="space-y-1">
                {issue.commits.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <GitCommit className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono text-xs truncate">{c.hash?.slice(0, 7) || c}</span>
                  </div>
                ))}
              </div>
            </DetailField>
          )}
          {issue?.pullRequests?.length > 0 && (
            <DetailField label="Pull Requests" icon={GitPullRequest}>
              <div className="space-y-1">
                {issue.pullRequests.map((pr, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <GitPullRequest className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{pr.title || pr}</span>
                  </div>
                ))}
              </div>
            </DetailField>
          )}
        </SidebarSection>
      )}

      {/* ── AUTOMATION — only show if data exists ── */}
      {hasAutomation && (
        <SidebarSection title="Automation" icon={Bot} defaultOpen={false}>
          {issue?.ruleExecutions?.length > 0 && (
            <DetailField label="Rule Executions" icon={Bot}>
              <div className="space-y-1">
                {issue.ruleExecutions.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{r.ruleName || r}</span>
                  </div>
                ))}
              </div>
            </DetailField>
          )}
          {issue?.automationLogs?.length > 0 && (
            <DetailField label="Automation Logs" icon={Link2}>
              <div className="space-y-1">
                {issue.automationLogs.map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{l.message || l}</span>
                  </div>
                ))}
              </div>
            </DetailField>
          )}
        </SidebarSection>
      )}
    </aside>
  );
}
