import { AlertTriangle, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/features/dashboard/context/DashboardContext";
import Skeleton from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";

const cards = [
    { key: "total", label: "Tổng nhiệm vụ", icon: ListTodo, tone: "blue", path: "/tasks" },
    { key: "inProgress", label: "Đang thực hiện", icon: Clock, tone: "blue", path: "/tasks" },
    { key: "overdue", label: "Quá hạn", icon: AlertTriangle, tone: "red", path: "/tasks" },
    { key: "completed", label: "Hoàn thành", icon: CheckCircle2, tone: "emerald", path: "/tasks" },
];

export default function DashboardStats() {
    const { stats, tasksLoading } = useDashboard();
    const navigate = useNavigate();

    if (tasksLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ key, label, icon, tone, path }) => {
                const value = stats?.[key] ?? 0;

                return (
                    <StatCard
                        key={key}
                        title={label}
                        value={value}
                        icon={icon}
                        tone={tone}
                        onClick={() => navigate(path)}
                    />
                );
            })}
        </div>
    );
}
