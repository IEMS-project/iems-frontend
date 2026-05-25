import React from "react";
import Avatar from "@/components/ui/Avatar";
import { Bug, BookOpen, Zap, CheckSquare, Layers, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Minus } from "lucide-react";

// Map issue type name → icon
const TYPE_ICONS = {
  EPIC: Zap,
  STORY: BookOpen,
  TASK: CheckSquare,
  BUG: Bug,
  SUBTASK: Layers,
};

const TYPE_COLORS = {
  EPIC: "text-purple-600 dark:text-purple-400",
  STORY: "text-green-600 dark:text-green-400",
  TASK: "text-blue-600 dark:text-blue-400",
  BUG: "text-red-600 dark:text-red-400",
  SUBTASK: "text-cyan-600 dark:text-cyan-400",
};

const TYPE_BG = {
  EPIC: "bg-purple-100 dark:bg-purple-900/30",
  STORY: "bg-green-100 dark:bg-green-900/30",
  TASK: "bg-blue-100 dark:bg-blue-900/30",
  BUG: "bg-red-100 dark:bg-red-900/30",
  SUBTASK: "bg-cyan-100 dark:bg-cyan-900/30",
};

export function getIssueTypeIcon(typeName) {
  const key = (typeName || "TASK").toUpperCase();
  return TYPE_ICONS[key] || CheckSquare;
}

export function getIssueTypeColor(typeName) {
  const key = (typeName || "TASK").toUpperCase();
  return TYPE_COLORS[key] || TYPE_COLORS.TASK;
}

export function getPriorityIcon(priorityName) {
  if (!priorityName) return { icon: Minus, color: "text-gray-400" };
  const key = priorityName.toUpperCase();
  if (key.includes("HIGHEST")) return { icon: ChevronsUp, color: "text-red-700 dark:text-red-400" };
  if (key.includes("HIGH")) return { icon: ChevronUp, color: "text-red-500 dark:text-red-400" };
  if (key.includes("MEDIUM")) return { icon: Minus, color: "text-yellow-500 dark:text-yellow-400" };
  if (key.includes("LOWEST")) return { icon: ChevronsDown, color: "text-blue-500 dark:text-blue-400" };
  if (key.includes("LOW")) return { icon: ChevronDown, color: "text-blue-500 dark:text-blue-400" };
  return { icon: Minus, color: "text-gray-400" };
}

const resolveIssueAssigneeId = (issue) =>
  issue?.assigneeId ||
  issue?.assignee?.accountId ||
  issue?.assignee?.userId ||
  issue?.assignee?.user?.accountId ||
  issue?.assignee?.user?.id ||
  issue?.assignee?.id;

const resolveMemberId = (member) =>
  member?.accountId ||
  member?.userId ||
  member?.id ||
  member?.user?.accountId ||
  member?.user?.id;

export default function IssueCard({
  issue,
  issueTypes = [],
  issuePriorities = [],
  members = [],
  onClick,
  draggable = false,
  onDragStart,
  className = "",
}) {
  const typeName = issueTypes.find(t => t.id === issue.issueTypeId)?.name || "TASK";
  const priorityObj = issuePriorities.find(p => p.id === issue.priorityId);
  const priorityName = priorityObj?.name || "";
  const priorityColor = priorityObj?.color || "#FFAB00";

  const TypeIcon = getIssueTypeIcon(typeName);
  const typeColor = getIssueTypeColor(typeName);
  const typeBg = TYPE_BG[typeName.toUpperCase()] || TYPE_BG.TASK;

  const { icon: PriorityIcon, color: prioColor } = getPriorityIcon(priorityName);

  const assigneeId = resolveIssueAssigneeId(issue);
  const assigneeObj = members.find(m => String(resolveMemberId(m) || "") === String(assigneeId || "")) || issue?.assignee;
  const assigneeName = assigneeObj?.fullName || assigneeObj?.userName || assigneeObj?.name || assigneeObj?.email;

  const typeBorderColor = {
    EPIC: "border-l-purple-500",
    STORY: "border-l-green-500",
    TASK: "border-l-blue-500",
    BUG: "border-l-red-500",
    SUBTASK: "border-l-cyan-500",
  }[typeName.toUpperCase()] || "border-l-blue-500";

  return (
    <div
      className={`group rounded-lg border border-border border-l-[4px] ${typeBorderColor} bg-card p-3 cursor-pointer 
        hover:border-r-border/80 hover:border-y-border/80 hover:shadow-md hover:-translate-y-0.5
        transition-all duration-150 ease-out ${className}`}
      onClick={() => onClick?.(issue)}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {/* Top row: type icon + issue key */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${typeBg}`}>
          <TypeIcon className={`w-3.5 h-3.5 ${typeColor}`} />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{issue.issueKey}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug mb-2 line-clamp-2">
        {issue.title}
      </p>

      {/* Labels dots */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.labels.map(l => (
            <div 
              key={l.id} 
              className="h-1.5 w-6 rounded-full" 
              style={{ backgroundColor: l.color }}
              title={l.name}
            />
          ))}
        </div>
      )}

      {/* Bottom row: priority + story points + assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityIcon className={`w-4 h-4 ${prioColor}`} title={priorityName} />
          {issue.storyPoints != null && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {issue.storyPoints}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {(assigneeObj || assigneeId) && (
          <Avatar
            user={assigneeObj}
            name={assigneeName || "Unassigned"}
            size="xs"
            className={!assigneeName ? "bg-muted text-muted-foreground" : ""}
          />
        )}
      </div>
    </div>
  );
}
