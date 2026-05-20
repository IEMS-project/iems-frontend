import { cn } from "@/lib/utils";

const toneClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    slate: "border-border bg-muted text-muted-foreground",
};

const accentClasses = {
    blue: "bg-blue-500 dark:bg-blue-400",
    emerald: "bg-emerald-500 dark:bg-emerald-400",
    amber: "bg-amber-500 dark:bg-amber-400",
    red: "bg-red-500 dark:bg-red-400",
    slate: "bg-muted-foreground",
};

export default function StatCard({
    title,
    value,
    icon: Icon,
    description,
    progress,
    tone = "blue",
    onClick,
    className = "",
}) {
    const progressValue = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : null;
    const Component = onClick ? "button" : "div";

    return (
        <Component
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left text-card-foreground shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
                onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                className
            )}
        >
            <div className={cn("absolute inset-y-4 left-0 w-1 rounded-r-full", accentClasses[tone] || accentClasses.blue)} />
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                </div>
                {Icon && (
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border", toneClasses[tone] || toneClasses.blue)}>
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            {description && <p className="mt-3 text-sm text-muted-foreground">{description}</p>}
            {progressValue !== null && (
                <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressValue}%` }} />
                    </div>
                </div>
            )}
        </Component>
    );
}
