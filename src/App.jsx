
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import ProjectDetailLayout from "@/features/projects/components/ProjectDetailLayout";
import ProjectOverviewPage from "@/pages/project/ProjectOverviewPage";
import ProjectBacklogPage from "@/pages/project/ProjectBacklogPage";
import ProjectBoardPage from "@/pages/project/ProjectBoardPage";
import ProjectSprintsPage from "@/pages/project/ProjectSprintsPage";
import ProjectMembersPage from "@/pages/project/ProjectMembersPage";
import ProjectSettingsPage from "@/pages/project/ProjectSettingsPage";
import ProjectIssueListPage from "@/pages/project/ProjectIssueListPage";
import ProjectCode from "@/features/projects/components/ProjectCode";
import ProjectTimelinePage from "@/pages/project/ProjectTimelinePage";
import ProjectBurndownPage from "@/pages/project/ProjectBurndownPage";
import Projects from "@/pages/Projects";
// import Departments from "@/pages/Departments";
// import DepartmentDetail from "@/pages/DepartmentDetail";
import Messages from "@/pages/Messages.jsx";
import Documents from "@/pages/Documents";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminAccessControl from "@/pages/AdminAccessControl";
import Calendar from "@/pages/Calendar";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import PermissionDenied from "@/pages/PermissionDenied";
import Chatbot from "@/pages/Chatbot";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Login";
import { useAuth } from "@/context/AuthContext.jsx";
import { getStoredTokens } from "@/lib/api";

function Protected({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
}

function AdminProtected({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has IAM ADMIN role
    const tokens = getStoredTokens();
    const roles = tokens?.userInfo?.roles || [];
    const isIamAdmin = Array.isArray(roles) && roles.includes("ADMIN");

    if (!isIamAdmin) {
        return <Navigate to="/permission-denied" replace />;
    }

    return children;
}

export default function App() {
    return (
        <>
            <Routes>
                {/* Login page - standalone, no layout */}
                <Route path="/login" element={<Login />} />

                {/* All other pages - with MainLayout */}
                <Route path="/*" element={
                    <Protected>
                        <MainLayout>
                            <Routes>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/projects" element={<Projects />} />
                                <Route path="/projects/:projectId" element={<ProjectDetailLayout />}>
                                    <Route index element={<Navigate to="overview" replace />} />
                                    <Route path="overview" element={<ProjectOverviewPage />} />
                                    <Route path="backlog" element={<ProjectBacklogPage />} />
                                    <Route path="board" element={<ProjectBoardPage />} />
                                    <Route path="tasks" element={<ProjectIssueListPage />} />
                                    <Route path="sprints" element={<ProjectSprintsPage />} />
                                    <Route path="burndown" element={<ProjectBurndownPage />} />
                                    <Route path="members" element={<ProjectMembersPage />} />
                                    <Route path="settings" element={<ProjectSettingsPage />} />
                                    <Route path="timeline" element={<ProjectTimelinePage />} />
                                    <Route path="code/*" element={<ProjectCode />} />
                                </Route>
                                {/* Redirect old /tasks to dashboard */}
                                <Route path="/tasks" element={<Navigate to="/dashboard" replace />} />
                                {/* Department routes commented out - department service removed from backend */}
                                {/* <Route path="/departments" element={<Departments />} /> */}
                                {/* <Route path="/departments/:departmentId" element={<DepartmentDetail />} /> */}
                                <Route path="/messages" element={<Messages />} />
                                <Route path="/documents" element={<Documents />} />
                                <Route path="/chatbot" element={<Chatbot />} />
                                <Route path="/calendar" element={<Calendar />} />
                                <Route path="/notifications" element={<Notifications />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/admin" element={<AdminAnalytics />} />
                                <Route path="/admin/access-control" element={
                                    <AdminProtected>
                                        <AdminAccessControl />
                                    </AdminProtected>
                                } />
                                <Route path="/permission-denied" element={<PermissionDenied />} />
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </MainLayout>
                    </Protected>
                } />
            </Routes>
        </>
    );
}