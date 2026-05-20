import { useNavigate } from "react-router-dom";
import PriorityBadge from "@/components/ui/PriorityBadge";
import IssueTypeBadge from "@/components/ui/IssueTypeBadge";
import { cn } from "@/lib/utils";

function getDueDateState(dueDate, t) {
    if (!dueDate) {
        return { label: t("dashboard.myTasks.noDueDate"), tone: "muted" };
    }

    try {
        const [year, month, day] = dueDate.toString().split("T")[0].split("-").map(Number);
        const dueDateOnly = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = dueDateOnly - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: t("dashboard.myTasks.overdue", { days: Math.abs(diffDays) }), tone: "danger" };
        }
        if (diffDays === 0) {
            return { label: t("dashboard.myTasks.dueToday"), tone: "warning" };
        }
        if (diffDays === 1) {
            return { label: t("dashboard.myTasks.dueTomorrow"), tone: "warning" };
        }
        return { label: t("dashboard.myTasks.dueInDays", { days: diffDays }), tone: "muted" };
    } catch {
        return { label: t("dashboard.myTasks.na"), tone: "muted" };
    }
}

function formatPriority(priority, t) {
    if (!priority) return t("dashboard.myTasks.na");
    const priorityUpper = priority.toString().toUpperCase();
    if (["HIGHEST", "CRITICAL"].includes(priorityUpper)) return t("dashboard.priority.highest");
    if (["HIGH", "CAO"].includes(priorityUpper)) return t("dashboard.priority.high");
    if (["MEDIUM", "NORMAL", "TRUNG BÌNH", "TRUNG BINH"].includes(priorityUpper)) return t("dashboard.priority.medium");
    if (["LOW", "THẤP", "THAP"].includes(priorityUpper)) return t("dashboard.priority.low");
    if (["LOWEST"].includes(priorityUpper)) return t("dashboard.priority.lowest");
    return priority;
}

export default function DashboardTaskRow({ task, t }) {
    const navigate = useNavigate();
    const dueDate = getDueDateState(task.dueDate, t);
    const taskType = task.taskType || task.type || "Nhiệm vụ";
    const priority = formatPriority(task.priority, t);
    const projectId = task.projectId || task.project?.id || task.project?.projectId;

    const handleOpenTask = () => {
        if (projectId) {
            navigate(`/projects/${projectId}/backlog`);
            return;
        }
        navigate("/tasks");
    };

    return (
        <li
            role="button"
            tabIndex={0}
            onClick={handleOpenTask}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenTask();
                }
            }}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-3 text-sm transition-colors hover:border-primary/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <IssueTypeBadge type={taskType} />
                        {task.issueKey && (
                            <span className="font-mono text-[10px] text-muted-foreground">{task.issueKey}</span>
                        )}
                    </div>
                    <div className="mt-1.5 truncate font-semibold text-foreground group-hover:text-primary">
                        {task.title || t("dashboard.myTasks.na")}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {task.projectName || task.project?.name || t("dashboard.myTasks.na")}
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                    <PriorityBadge priority={priority} />
                    <span
                        className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            dueDate.tone === "danger" && "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
                            dueDate.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
                            dueDate.tone === "muted" && "border-border bg-muted/50 text-muted-foreground"
                        )}
                    >
                        {dueDate.label}
                    </span>
                </div>
            </div>
        </li>
    );
}
