import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";

import AdminLoginPage from "@/features/auth/pages/AdminLoginPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import PermissionDeniedPage from "@/features/auth/pages/PermissionDeniedPage";
import ChatbotPage from "@/features/chatbot/pages/ChatbotPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import DocumentsPage from "@/features/documents/pages/DocumentsPage";
import MessagesPage from "@/features/messages/pages/MessagesPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import PaymentCancelPage from "@/features/payments/pages/PaymentCancelPage";
import PaymentReturnPage from "@/features/payments/pages/PaymentReturnPage";
import PremiumUpgradePage from "@/features/profile/pages/PremiumUpgradePage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import SettingsPage from "@/features/profile/pages/SettingsPage";
import ProjectAgentPage from "@/pages/project/ProjectAgentPage";
import ProjectBacklogPage from "@/pages/project/ProjectBacklogPage";
import ProjectBoardPage from "@/pages/project/ProjectBoardPage";
import ProjectDocumentsPage from "@/pages/project/ProjectDocumentsPage";
import ProjectIssueListPage from "@/pages/project/ProjectIssueListPage";
import ProjectSettingsPage from "@/pages/project/ProjectSettingsPage";
import ProjectSprintsPage from "@/pages/project/ProjectSprintsPage";
import ProjectBurndownPage from "@/features/projects/pages/ProjectBurndownPage";
import ProjectCode from "@/features/projects/components/ProjectCode";
import ProjectDetailLayout from "@/features/projects/components/ProjectDetailLayout";
import ProjectMembersPage from "@/features/projects/pages/ProjectMembersPage";
import ProjectOverviewPage from "@/features/projects/pages/ProjectOverviewPage";
import ProjectTimelinePage from "@/features/projects/pages/ProjectTimelinePage";
import ProjectsPage from "@/features/projects/pages/ProjectsPage";

const AdminSubscriptionPage = lazy(() => import("@/features/admin/pages/AdminSubscriptionPage"));

function withPageSuspense(element) {
    return <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>{element}</Suspense>;
}

export const publicRoutes = [
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <Navigate to="/login" replace /> },
    { path: "/admin-login", element: <AdminLoginPage /> },
];

export const projectDetailRoute = {
    path: "/projects/:projectId",
    element: <ProjectDetailLayout />,
    children: [
        { index: true, element: <Navigate to="overview" replace /> },
        { path: "overview", element: <ProjectOverviewPage /> },
        { path: "backlog", element: <ProjectBacklogPage /> },
        { path: "board", element: <ProjectBoardPage /> },
        { path: "tasks", element: <ProjectIssueListPage /> },
        { path: "agent", element: <ProjectAgentPage /> },
        { path: "sprints", element: <ProjectSprintsPage /> },
        { path: "burndown", element: <ProjectBurndownPage /> },
        { path: "members", element: <ProjectMembersPage /> },
        { path: "settings", element: <ProjectSettingsPage /> },
        { path: "timeline", element: <ProjectTimelinePage /> },
        { path: "code/*", element: <ProjectCode /> },
        { path: "documents", element: <ProjectDocumentsPage /> },
    ],
};

export const appRoutes = [
    { path: "/dashboard", element: <DashboardPage /> },
    { path: "/projects", element: <ProjectsPage /> },
    { path: "/messages", element: <MessagesPage /> },
    { path: "/documents", element: <DocumentsPage /> },
    { path: "/chatbot", element: <ChatbotPage /> },
    { path: "/notifications", element: <NotificationsPage /> },
    { path: "/payment/return", element: <PaymentReturnPage /> },
    { path: "/payment/cancel", element: <PaymentCancelPage /> },
    { path: "/profile", element: <ProfilePage /> },
    { path: "/settings", element: <SettingsPage /> },
    { path: "/premium", element: <PremiumUpgradePage /> },
    { path: "/permission-denied", element: <PermissionDeniedPage /> },
];

export const adminRoutes = [
    { path: "/admin", element: withPageSuspense(<AdminSubscriptionPage />) },
    { path: "/admin/access-control", element: <Navigate to="/admin?tab=accounts" replace /> },
    { path: "/admin/subscription", element: <Navigate to="/admin?tab=plans" replace /> },
];
