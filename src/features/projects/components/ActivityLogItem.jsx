import React from "react";
import { ArrowRight, ArrowRightLeft, UserCheck, Plus, Minus, Zap, CheckCircle2 } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";

export function getActivityMeta(action) {
    switch (action) {
        case "ISSUE_CREATED":
            return { icon: Plus, colorClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" };
        case "ISSUE_STATUS_CHANGED":
            return { icon: ArrowRightLeft, colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" };
        case "ISSUE_ASSIGNED":
            return { icon: UserCheck, colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" };
        case "ISSUE_MOVED_TO_SPRINT":
            return { icon: Zap, colorClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" };
        case "ISSUE_REMOVED_FROM_SPRINT":
            return { icon: Minus, colorClass: "bg-muted text-muted-foreground" };
        default:
            return { icon: CheckCircle2, colorClass: "bg-muted text-muted-foreground" };
    }
}

function StatusBadge({ value, workflowStatuses }) {
    if (!value) return null;
    const status = workflowStatuses.find(s => s.id === value || s.name === value);
    const name = status?.name || value;
    const color = status?.color || "#6B7280";
    return (
        <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: color + "22", color, border: `1px solid ${color}55` }}
        >
            {name}
        </span>
    );
}

/**
 * @param {object} log - activity log item
 * @param {array}  workflowStatuses - from project context
 * @param {boolean} showIssue - show issueKey context (for project-level feed)
 */
export default function ActivityLogItem({ log, workflowStatuses = [], showIssue = false }) {
    const { icon: Icon, colorClass } = getActivityMeta(log.action);

    // Resolve status from/to — prefer explicit fields, fallback: parse details "KEY: A → B"
    let fromVal = log.oldValue ?? null;
    let toVal = log.newValue ?? null;
    if (log.action === "ISSUE_STATUS_CHANGED" && fromVal == null && toVal == null && log.details?.includes("→")) {
        const colonIdx = log.details.indexOf(":");
        const raw = colonIdx !== -1 ? log.details.slice(colonIdx + 1) : log.details;
        const parts = raw.split("→");
        fromVal = parts[0]?.trim() || null;
        toVal = parts[1]?.trim() || null;
    }
    const showStatusBadges = log.action === "ISSUE_STATUS_CHANGED" && (fromVal != null || toVal != null);

    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
            <div className={cn("mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {log.userImage ? (
                        <img src={log.userImage} alt={log.userName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <Avatar name={log.userName || "?"} size="xs" className="flex-shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-foreground truncate">{log.userName || "Unknown"}</span>
                    {showIssue && log.issueKey && (
                        <span className="text-xs text-muted-foreground shrink-0">· {log.issueKey}</span>
                    )}
                    <span
                        className="text-xs text-muted-foreground shrink-0 ml-auto"
                        title={log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                    >
                        {timeAgo(log.createdAt)}
                    </span>
                </div>

                {showStatusBadges ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge value={fromVal} workflowStatuses={workflowStatuses} />
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <StatusBadge value={toVal} workflowStatuses={workflowStatuses} />
                    </div>
                ) : (
                    <p className="text-sm text-foreground leading-relaxed">{log.details || log.action}</p>
                )}
            </div>
        </div>
    );
}
