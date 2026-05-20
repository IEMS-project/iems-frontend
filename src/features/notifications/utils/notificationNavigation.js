export function getNotificationTarget(notification) {
    const isIssue = notification?.entityType === "ISSUE" && notification?.entityId && notification?.projectId;

    if (!isIssue) {
        return notification?.linkPath || null;
    }

    const [basePath, queryString] = (notification.linkPath || `/projects/${notification.projectId}/backlog`).split("?");
    const params = new URLSearchParams(queryString || "");
    params.set("issueId", notification.entityId);

    return `${basePath}?${params.toString()}`;
}
