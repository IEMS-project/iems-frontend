import { Circle, CheckCircle2, Clock3, PauseCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles = {
    done: {
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    progress: {
        icon: Clock3,
        className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
    },
    planning: {
        icon: Circle,
        className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
    },
    blocked: {
        icon: AlertCircle,
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    },
    hold: {
        icon: PauseCircle,
        className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
    },
    cancelled: {
        icon: XCircle,
        className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    },
};

function getStatusVariant(status) {
    const value = String(status || "").toLowerCase();
    if (/(done|completed|complete|closed|resolved|hoàn|hoan)/.test(value)) return "done";
    if (/(progress|doing|active|review|đang|dang)/.test(value)) return "progress";
    if (/(blocked|block)/.test(value)) return "blocked";
    if (/(hold|pause|pending)/.test(value)) return "hold";
    if (/(cancel|reject)/.test(value)) return "cancelled";
    return "planning";
}

export default function StatusBadge({ status, children, className = "", showIcon = true }) {
    const label = children || status || "N/A";
    const variant = statusStyles[getStatusVariant(label)];
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
