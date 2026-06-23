import { useState, useEffect, useCallback, useRef } from "react";
import notificationService from "@/features/notifications/api/notificationService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const RECONNECT_DELAY = 5000; // 5s

export function useNotifications() {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const esRef = useRef(null);
    const reconnectRef = useRef(null);
    const mountedRef = useRef(true);

    // ── Fetch list ────────────────────────────────────────────────

    const fetchNotifications = useCallback(async (pageNum = 0, append = false) => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications({ page: pageNum, size: 20 });
            if (!mountedRef.current) return;
            const items = data.data || [];
            setNotifications(prev => append ? [...prev, ...items] : items);
            setUnreadCount(data.unreadCount ?? 0);
            setTotalPages(data.totalPages ?? 1);
            setPage(pageNum);
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMore = useCallback(() => {
        if (page + 1 < totalPages) {
            fetchNotifications(page + 1, true);
        }
    }, [page, totalPages, fetchNotifications]);

    // ── Actions ───────────────────────────────────────────────────

    const markRead = useCallback(async (id) => {
        try {
            await notificationService.markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Failed to mark read:", e);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await notificationService.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error("Failed to mark all read:", e);
        }
    }, []);

    // ── SSE ───────────────────────────────────────────────────────

    const connectSSE = useCallback(() => {
        if (!isAuthenticated) return;

        const es = notificationService.createEventSource();
        if (!es) return;
        esRef.current = es;

        es.addEventListener("notification", (e) => {
            try {
                const notification = JSON.parse(e.data);
                if (!mountedRef.current) return;

                // Prepend to list
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show toast
                toast(notification.title, {
                    description: notification.body,
                    duration: 5000,
                    action: notification.linkPath ? {
                        label: "View",
                        onClick: () => window.location.href = notification.linkPath,
                    } : undefined,
                });
            } catch (err) {
                console.error("Failed to parse SSE notification:", err);
            }
        });

        es.onerror = () => {
            es.close();
            esRef.current = null;
            // Auto-reconnect after delay
            if (mountedRef.current && isAuthenticated) {
                reconnectRef.current = setTimeout(connectSSE, RECONNECT_DELAY);
            }
        };
    }, [isAuthenticated]);

    useEffect(() => {
        mountedRef.current = true;
        if (isAuthenticated) {
            fetchNotifications(0);
            connectSSE();
        }
        return () => {
            mountedRef.current = false;
            clearTimeout(reconnectRef.current);
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        notifications,
        unreadCount,
        loading,
        page,
        totalPages,
        fetchNotifications,
        loadMore,
        markRead,
        markAllRead,
    };
}
