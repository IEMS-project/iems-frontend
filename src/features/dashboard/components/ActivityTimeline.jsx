import { useTranslation } from "react-i18next";
import { Activity, CheckSquare, GitCommit, MessageSquare, PlusCircle, Repeat2, Trash2, UserPlus, Zap } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import UserAvatar from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

function timeAgo(dateStr, t) {
    if (!dateStr) return "";
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return t("dashboard.recentActivity.justNow");
    if (diff < 3600) return t("dashboard.recentActivity.minutesAgo", { count: Math.floor(diff / 60) });
    if (diff < 86400) return t("dashboard.recentActivity.hoursAgo", { count: Math.floor(diff / 3600) });
    return t("dashboard.recentActivity.daysAgo", { count: Math.floor(diff / 86400) });
}

function getActivityText(activity, fallbackLabel) {
    return activity.details || activity.description || activity.message || fallbackLabel;
}

export default function ActivityTimeline({ activities }) {
    const { t } = useTranslation();
    const typeConfig = {
        ISSUE_CREATED: { icon: Zap, color: "text-blue-600 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40", label: t("dashboard.recentActivity.types.created") },
        ISSUE_STATUS_CHANGED: { icon: Repeat2, color: "text-violet-600 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-950/40", label: "Đổi trạng thái" },
        ISSUE_REMOVED_FROM_SPRINT: { icon: Trash2, color: "text-red-600 dark:text-red-300", bg: "bg-red-50 dark:bg-red-950/40", label: "Gỡ khỏi sprint" },
        ISSUE_MOVED_TO_SPRINT: { icon: PlusCircle, color: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", label: "Thêm vào sprint" },
        ISSUE_ADDED_TO_SPRINT: { icon: PlusCircle, color: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", label: "Thêm vào sprint" },
        ISSUE_UPDATED: { icon: GitCommit, color: "text-sky-600 dark:text-sky-300", bg: "bg-sky-50 dark:bg-sky-950/40", label: t("dashboard.recentActivity.types.updated") },
        ISSUE_ASSIGNED: { icon: UserPlus, color: "text-violet-600 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-950/40", label: t("dashboard.recentActivity.types.assigned") },
        ISSUE_COMPLETED: { icon: CheckSquare, color: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", label: t("dashboard.recentActivity.types.completed") },
        COMMENT_ADDED: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", label: t("dashboard.recentActivity.types.commented") },
        DEFAULT: { icon: Activity, color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-50 dark:bg-slate-900/70", label: t("dashboard.recentActivity.types.activity") },
    };

    const getConfig = (type) => typeConfig[type] || typeConfig.DEFAULT;

    if (!activities.length) {
        return (
            <EmptyState
                icon={Activity}
                title={t("dashboard.recentActivity.emptyTitle")}
                description={t("dashboard.recentActivity.emptyDescription")}
            />
        );
    }

    return (
        <ul className="relative space-y-0">
            {activities.map((activity, index) => {
                const config = getConfig(activity.action || activity.type || activity.activityType);
                const Icon = config.icon;
                const text = getActivityText(activity, config.label);

                return (
                    <li key={activity.id || index} className={cn("relative flex gap-3 pb-4", index === activities.length - 1 && "pb-0")}>
                        {index < activities.length - 1 && (
                            <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-border" />
                        )}
                        <div className="relative z-10 h-8 w-8 shrink-0">
                            <UserAvatar
                                user={{
                                    name: activity.userName,
                                    image: activity.userImage,
                                    avatar: activity.userImage,
                                }}
                                src={activity.userImage}
                                name={activity.userName}
                                size="sm"
                                className="h-8 w-8"
                            />
                            <span className={cn("absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-card", config.bg)}>
                                <Icon className={cn("h-2.5 w-2.5", config.color)} />
                            </span>
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl px-1 pb-1">
                            <p className="line-clamp-2 text-sm text-foreground">
                                <span className="font-medium">{activity.userName || config.label}</span>
                                {activity.userName ? " - " : ""}
                                {text}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                {timeAgo(activity.createdAt, t)}
                                {activity.projectName ? ` - ${activity.projectName}` : ""}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
