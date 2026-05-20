import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { AdminRoute, ProtectedRoute } from "@/routes/RouteGuards";
import { adminRoutes, appRoutes, projectDetailRoute, publicRoutes } from "@/routes/routeConfig";

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
        <Routes>
            {publicRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
            ))}
            <Route path="/*" element={<ProtectedAppRoutes />} />
        </Routes>
    );
}
