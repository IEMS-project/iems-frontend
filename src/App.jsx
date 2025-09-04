
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Teams from "./pages/Teams";
import DepartmentDetail from "./pages/DepartmentDetail";
import Messages from "./pages/Messages";
import Documents from "./pages/Documents";
import AdminAnalytics from "./pages/AdminAnalytics";
import Calendar from "./pages/Calendar";
import Notifications from "./pages/Notifications";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
	return (
		<MainLayout>
			<Routes>
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/projects" element={<Projects />} />
				<Route path="/projects/:projectId" element={<Project />} />
				<Route path="/tasks" element={<Tasks />} />
				<Route path="/teams" element={<Teams />} />
				<Route path="/teams/:departmentId" element={<DepartmentDetail />} />
				<Route path="/messages" element={<Messages />} />
				<Route path="/documents" element={<Documents />} />
				<Route path="/calendar" element={<Calendar />} />
				<Route path="/notifications" element={<Notifications />} />
				<Route path="/admin" element={<AdminAnalytics />} />
				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
		</MainLayout>
	);
}