
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Departments from "./pages/Departments";
import DepartmentDetail from "./pages/DepartmentDetail";
import Messages from "./pages/Messages.jsx";
import Documents from "./pages/Documents";
import AdminAnalytics from "./pages/AdminAnalytics";
import Calendar from "./pages/Calendar";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext.jsx";

function Protected({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
}

export default function App() {
    return (
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
                            <Route path="/projects/:projectId" element={<ProjectDetail />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/departments" element={<Departments />} />
                            <Route path="/departments/:departmentId" element={<DepartmentDetail />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/documents" element={<Documents />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/admin" element={<AdminAnalytics />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </MainLayout>
                </Protected>
            } />
        </Routes>
    );
}