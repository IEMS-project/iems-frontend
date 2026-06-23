import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDashboard } from "@/features/dashboard/context/DashboardContext";
import Skeleton from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import DashboardTaskRow from "@/features/dashboard/components/DashboardTaskRow";

function getPriorityRank(priority) {
    const value = String(priority || "").toUpperCase();
    if (["HIGHEST", "CRITICAL"].includes(value)) return 0;
    if (["HIGH", "CAO"].includes(value)) return 1;
    if (["MEDIUM", "NORMAL", "TRUNG BÌNH", "TRUNG BINH"].includes(value)) return 2;
    return 3;
}

function getDueTime(dueDate) {
    if (!dueDate) return Number.MAX_SAFE_INTEGER;
    const time = new Date(dueDate).getTime();
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function isDueToday(dueDate) {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

export default function MyTasks() {
    const { t } = useTranslation();
    const { tasks: allTasks, tasksLoading: loading } = useDashboard();

    const tasks = useMemo(() => {
        return (Array.isArray(allTasks) ? allTasks : [])
            .filter((task) => {
                const category = (task.statusCategory || "").toString().toUpperCase();
                return category !== "DONE";
            })
            .sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority) || getDueTime(a.dueDate) - getDueTime(b.dueDate));
    }, [allTasks]);
    const dueToday = tasks.filter((task) => isDueToday(task.dueDate));
    const highlightedTasks = (dueToday.length ? dueToday : tasks).slice(0, 3);

    return (
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
                <SectionHeader
                    icon={ClipboardList}
                    title={t("dashboard.myTasks.todayTitle")}
                />
            </CardHeader>
            <CardContent className="pt-0">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <Skeleton key={item} className="h-16 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : highlightedTasks.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title={t("dashboard.myTasks.noTasks")}
                    />
                ) : (
                    <div className="space-y-4">
                        <ul className="space-y-1.5">
                            {highlightedTasks.map((task) => (
                                <DashboardTaskRow key={task.id || task.taskId} task={task} t={t} />
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
