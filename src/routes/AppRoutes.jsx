import { Navigate, Route, Routes, useLocation, matchPath } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { AdminRoute, ProtectedRoute } from "@/routes/RouteGuards";
import { adminRoutes, appRoutes, projectDetailRoute, publicRoutes } from "@/routes/routeConfig";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const routeTitles = [
    { pattern: "/login", title: "Login" },
    { pattern: "/admin-login", title: "Admin Login" },
    { pattern: "/dashboard", title: "Dashboard" },
    { pattern: "/projects", title: "Projects" },
    { pattern: "/messages", title: "Messages" },
    { pattern: "/documents", title: "Documents" },
    { pattern: "/chatbot", title: "AI Assistant" },
    { pattern: "/notifications", title: "Notifications" },
    { pattern: "/payment/return", title: "Payment Result" },
    { pattern: "/payment/cancel", title: "Payment Cancelled" },
    { pattern: "/profile", title: "Profile" },
    { pattern: "/settings", title: "Settings" },
    { pattern: "/admin", title: "Admin Console" },
    { pattern: "/admin/access-control", title: "Admin Console" },
    { pattern: "/admin/subscription", title: "Admin Console" },
    { pattern: "/premium", title: "Premium" },
    { pattern: "/permission-denied", title: "Permission Denied" },
];

function AppDocumentTitle() {
    const location = useLocation();
    const matchedRoute = routeTitles.find((route) =>
        matchPath({ path: route.pattern, end: true }, location.pathname)
    );

    const isProjectDetail = matchPath({ path: "/projects/:projectId/*", end: false }, location.pathname);
    useDocumentTitle(isProjectDetail ? "Project" : matchedRoute?.title);
    return null;
}

function AdminOnly({ children }) {
    return <AdminRoute>{children}</AdminRoute>;
}

function ProtectedAppRoutes() {
    return (
        <ProtectedRoute>
            <MainLayout>
                <Routes>
                    {appRoutes.map((route) => (
                        <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                    <Route path={projectDetailRoute.path} element={projectDetailRoute.element}>
                        {projectDetailRoute.children.map((route) => (
                            route.index ? (
                                <Route key="project-index" index element={route.element} />
                            ) : (
                                <Route key={route.path} path={route.path} element={route.element} />
                            )
                        ))}
                    </Route>
                    {adminRoutes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<AdminOnly>{route.element}</AdminOnly>}
                        />
                    ))}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </MainLayout>
        </ProtectedRoute>
    );
}

export default function AppRoutes() {
    return (
        <>
            <AppDocumentTitle />
            <Routes>
                {publicRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
                <Route path="/*" element={<ProtectedAppRoutes />} />
            </Routes>
        </>
    );
}
