import { getStoredTokens } from "@/lib/api";

const NOTIFICATION_BASE_URL =
    import.meta.env.VITE_NOTIFICATION_URL || "http://localhost:8090";

function authHeaders() {
    const tokens = getStoredTokens();
    return tokens?.accessToken
        ? { Authorization: `Bearer ${tokens.accessToken}` }
        : {};
}

async function apiFetch(path, options = {}) {
    const res = await fetch(`${NOTIFICATION_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            ...(options.headers || {}),
        },
    });
    if (!res.ok) throw new Error(`notification-service: ${res.status}`);
    return res.json();
}

const notificationService = {
    /** Get paginated list of notifications */
    getNotifications({ page = 0, size = 20, unreadOnly = false } = {}) {
        return apiFetch(
            `/notifications?page=${page}&size=${size}&unreadOnly=${unreadOnly}`
        );
    },

    /** Get unread count badge */
    getUnreadCount() {
        return apiFetch("/notifications/unread-count");
    },

    /** Mark single notification as read */
    markRead(id) {
        return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
    },

    /** Mark all as read */
    markAllRead() {
        return apiFetch("/notifications/read-all", { method: "PATCH" });
    },

    /**
     * Create SSE EventSource for realtime notifications.
     * Returns an EventSource — caller is responsible for closing it.
     */
    createEventSource() {
        const tokens = getStoredTokens();
        const token = tokens?.accessToken;
        if (!token) return null;
        // Include JWT via query param (SSE can't set headers)
        return new EventSource(
            `${NOTIFICATION_BASE_URL}/notifications/stream?token=${token}`
        );
    },
};

export default notificationService;
