import React, { useState } from "react";
import {
    Bell,
    CheckCheck,
    CheckCircle2,
    MessageSquare,
    RefreshCw,
    Rocket,
    Target,
    Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { HighlightedNotificationText } from "@/features/notifications/utils/notificationDisplay.jsx";
import { getNotificationTarget } from "@/features/notifications/utils/notificationNavigation";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
    ISSUE_ASSIGNED: { icon: Target, label: "Assigned to issue", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
    ISSUE_COMMENTED: { icon: MessageSquare, label: "New comment", color: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
    MEMBER_ADDED: { icon: Users, label: "Added to project", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
    SPRINT_STARTED: { icon: Rocket, label: "Sprint started", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    SPRINT_COMPLETED: { icon: CheckCircle2, label: "Sprint completed", color: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
};

const FILTERS = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
];

function NotificationRow({ notification, onClick }) {
    const config = TYPE_CONFIG[notification.type] || { icon: Bell, label: "Notification", color: "bg-muted text-muted-foreground" };
    const Icon = config.icon;
    const timeAgo = notification.createdAt
        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })
        : "";

    return (
        <button
            type="button"
            onClick={() => onClick(notification)}
            className={cn(
                "group flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/60",
                !notification.read && "bg-primary/5"
            )}
        >
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", config.color)}>
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                    <span className={cn("text-sm font-semibold leading-snug", notification.read ? "text-foreground/80" : "text-foreground")}>
                        <HighlightedNotificationText text={notification.title} notification={notification} />
                    </span>
                    {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </span>
                {notification.body && (
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                        <HighlightedNotificationText text={notification.body} notification={notification} />
                    </span>
                )}
                <span className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", config.color)}>
                        {config.label}
                    </span>
                    {notification.projectName && <span className="text-[11px] text-muted-foreground">{notification.projectName}</span>}
                    {timeAgo && <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo}</span>}
                </span>
            </span>
        </button>
    );
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all");
    const {
        notifications,
        unreadCount,
        loading,
        page,
        totalPages,
        fetchNotifications,
        loadMore,
        markRead,
        markAllRead,
    } = useNotifications();

    const displayed = activeFilter === "unread"
        ? notifications.filter((notification) => !notification.read)
        : notifications;

    const handleClick = (notification) => {
        if (!notification.read) markRead(notification.id);
        const target = getNotificationTarget(notification);
        if (target) navigate(target);
    };

    return (
        <div className="w-full space-y-6">
            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                    <SectionHeader
                        icon={Bell}
                        title="Notifications"
                        description={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All notifications are up to date."}
                        action={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fetchNotifications(0)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                    title="Refresh"
                                >
                                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllRead}
                                        className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        }
                    />
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="mb-4 flex w-fit gap-1 rounded-lg bg-muted p-1">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => setActiveFilter(filter.key)}
                                className={cn(
                                    "flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors",
                                    activeFilter === filter.key
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {filter.label}
                                {filter.key === "unread" && unreadCount > 0 && (
                                    <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="-mx-6 border-t border-border">
                        {loading && displayed.length === 0 ? (
                            <div className="p-12 text-center">
                                <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Loading notifications...</p>
                            </div>
                        ) : displayed.length === 0 ? (
                            <div className="p-12">
                                <EmptyState
                                    icon={Bell}
                                    title={activeFilter === "unread" ? "All caught up!" : "No notifications yet"}
                                    description={activeFilter === "unread"
                                        ? "You have no unread notifications."
                                        : "Notifications will appear here when something happens in your projects."}
                                />
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {displayed.map((notification) => (
                                    <NotificationRow key={notification.id} notification={notification} onClick={handleClick} />
                                ))}
                            </div>
                        )}
                    </div>

                    {!loading && page + 1 < totalPages && (
                        <div className="-mx-6 border-t border-border px-6 pt-4 text-center">
                            <button type="button" onClick={loadMore} className="text-sm font-medium text-primary hover:underline">
                                Load more
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
