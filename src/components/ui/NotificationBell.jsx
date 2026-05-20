import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, CheckCircle2, ChevronRight, MessageSquare, Rocket, Target, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { HighlightedNotificationText } from "@/features/notifications/utils/notificationDisplay.jsx";
import { getNotificationTarget } from "@/features/notifications/utils/notificationNavigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
    ISSUE_ASSIGNED: { icon: Target, color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
    ISSUE_COMMENTED: { icon: MessageSquare, color: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
    MEMBER_ADDED: { icon: Users, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
    SPRINT_STARTED: { icon: Rocket, color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    SPRINT_COMPLETED: { icon: CheckCircle2, color: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
};

function NotificationItem({ notification, onRead, onNavigate }) {
    const config = TYPE_CONFIG[notification.type] || { icon: Bell, color: "bg-muted text-muted-foreground" };
    const Icon = config.icon;
    const timeAgo = notification.createdAt
        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })
        : "";

    const handleClick = () => {
        if (!notification.read) onRead(notification.id);
        const target = getNotificationTarget(notification);
        if (target) onNavigate(target);
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground",
                !notification.read && "bg-primary/10"
            )}
        >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", config.color)}>
                <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium leading-snug", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                    <HighlightedNotificationText text={notification.title} notification={notification} />
                </p>
                {notification.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        <HighlightedNotificationText text={notification.body} notification={notification} />
                    </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{timeAgo}</p>
            </div>

            {!notification.read && (
                <div className="mt-1.5 shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
            )}
        </div>
    );
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState(null);
    const buttonRef = useRef(null);
    const panelRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        loading,
        markRead,
        markAllRead,
    } = useNotifications();

    const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const panelWidth = 360;
        const viewportPadding = 12;
        const left = Math.max(viewportPadding, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - viewportPadding));

        setDropdownStyle({
            position: "fixed",
            top: rect.bottom + 10,
            left,
            width: panelWidth,
            zIndex: 2147483647,
        });
    };

    // Keep dropdown aligned to the bell button while open
    useEffect(() => {
        if (!open) {
            setDropdownStyle(null);
            return;
        }

        updatePosition();

        const onReposition = () => updatePosition();
        window.addEventListener("resize", onReposition);
        window.addEventListener("scroll", onReposition, true);

        return () => {
            window.removeEventListener("resize", onReposition);
            window.removeEventListener("scroll", onReposition, true);
        };
    }, [open]);

    // Close on outside click
    useEffect(() => {
        function handleOutside(e) {
            const clickedBell = buttonRef.current && buttonRef.current.contains(e.target);
            const clickedPanel = panelRef.current && panelRef.current.contains(e.target);
            if (!clickedBell && !clickedPanel) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [open]);

    const handleNavigate = (path) => {
        setOpen(false);
        navigate(path);
    };

    const preview = notifications.slice(0, 8);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setOpen(v => !v)}
                className="relative z-[2147483647] rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Thông báo"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && dropdownStyle && createPortal(
                <div
                    ref={panelRef}
                    style={dropdownStyle}
                className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
            >
                    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Thông báo
                            </h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-muted-foreground">{unreadCount} chưa đọc</p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] divide-y divide-border overflow-y-auto bg-card">
                        {loading && notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
                        ) : preview.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Chưa có thông báo</p>
                            </div>
                        ) : (
                            preview.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onRead={markRead}
                                    onNavigate={handleNavigate}
                                />
                            ))
                        )}
                    </div>

                    <div
                        onClick={() => { setOpen(false); navigate("/notifications"); }}
                        className="flex cursor-pointer items-center justify-center gap-1 border-t border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        Xem tất cả thông báo
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
