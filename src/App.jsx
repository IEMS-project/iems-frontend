
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Departments from "./pages/Departments";
import DepartmentDetail from "./pages/DepartmentDetail";
import Messages from "./pages/Messages";
import Documents from "./pages/Documents";
import AdminAnalytics from "./pages/AdminAnalytics";
import Calendar from "./pages/Calendar";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
	return (
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
	);
}