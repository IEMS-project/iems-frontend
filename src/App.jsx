
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Teams from "./pages/Teams";
import DepartmentDetail from "./pages/DepartmentDetail";
import Messages from "./pages/Messages";

export default function App() {
	return (
		<Routes>
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/projects" element={<Projects />} />
			<Route path="/projects/:projectId" element={<Project />} />
			<Route path="/tasks" element={<Tasks />} />
			<Route path="/teams" element={<Teams />} />
			<Route path="/teams/:departmentId" element={<DepartmentDetail />} />
			<Route path="/messages" element={<Messages />} />
			<Route path="*" element={<Navigate to="/dashboard" replace />} />
		</Routes>
	);
}