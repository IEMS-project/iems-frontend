export function isFullHeightRoute(pathname) {
    return (
        (pathname.startsWith("/projects/") && pathname !== "/projects") ||
        pathname === "/messages" ||
        pathname === "/chatbot" ||
        pathname.startsWith("/admin/") ||
        pathname === "/premium"
    );
}
