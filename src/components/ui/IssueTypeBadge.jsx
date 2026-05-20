import { Bug, GitBranch, Layers3, ListChecks, SquareCheckBig } from "lucide-react";
import { cn } from "@/lib/utils";

const typeStyles = {
    bug: {
        icon: Bug,
        className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    },
    epic: {
        icon: Layers3,
        className: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300",
    },
    story: {
        icon: GitBranch,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    subtask: {
        icon: ListChecks,
        className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    },
    task: {
        icon: SquareCheckBig,
        className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
    },
};

function getTypeVariant(type) {
    const value = String(type || "").toLowerCase();
    if (value.includes("bug")) return "bug";
    if (value.includes("epic")) return "epic";
    if (value.includes("story")) return "story";
    if (value.includes("sub")) return "subtask";
    return "task";
}

export default function IssueTypeBadge({ type, children, className = "", showIcon = true }) {
    const label = children || type || "Nhiệm vụ";
    const variant = typeStyles[getTypeVariant(label)];
    const Icon = variant.icon;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
                variant.className,
                className
            )}
        >
            {showIcon && <Icon className="h-3 w-3" />}
            <span className="truncate">{label}</span>
        </span>
    );
}
