import { ChevronsUp, ChevronUp, Minus, ChevronDown, ChevronsDown, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityStyles = {
    highest: {
        icon: ChevronsUp,
        className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    },
    high: {
        icon: ChevronUp,
        className: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
    },
    medium: {
        icon: Minus,
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    },
    low: {
        icon: ChevronDown,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    lowest: {
        icon: ChevronsDown,
        className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
    },
    none: {
        icon: Flag,
        className: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
    },
};

function getPriorityVariant(priority) {
    const value = String(priority || "").toLowerCase();
    if (/(highest|urgent|critical|khẩn|khan)/.test(value)) return "highest";
    if (/(high|cao)/.test(value)) return "high";
    if (/(medium|normal|trung)/.test(value)) return "medium";
    if (/(lowest)/.test(value)) return "lowest";
    if (/(low|thấp|thap)/.test(value)) return "low";
    return "none";
}

export default function PriorityBadge({ priority, children, className = "", showIcon = true }) {
    const label = children || priority || "N/A";
    const variant = priorityStyles[getPriorityVariant(label)];
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
