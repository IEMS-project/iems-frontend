import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Chatbot from "../chat/Chatbot";
import { FaRobot } from "react-icons/fa";
import { FaMoon, FaSun } from "react-icons/fa";

export default function MainLayout({ children }) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);


	return (
		<div className="flex h-screen w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
			{/* Desktop/Tablet Sidebar */}
			<Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />

			<div className="flex min-w-0 flex-1">
				{/* Main content area */}
				<div className="relative flex min-w-0 flex-1 flex-col">
					<main className="min-w-0 flex-1 overflow-auto p-4">
						{children}
					</main>

					{/* Floating actions */}
					<button
						aria-label="Toggle chatbot"
						onClick={() => setChatOpen(v => !v)}
						className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700 shadow-lg ring-1 ring-blue-500/30 transition hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-blue-300 dark:ring-0 dark:hover:bg-blue-700 dark:hover:text-white dark:focus:ring-blue-500"
					>
						<FaRobot className="h-6 w-6" />
					</button>

					<button
						aria-label="Open navigation"
						onClick={() => setMobileNavOpen(true)}
						className="fixed bottom-6 left-6 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
					>
						☰
					</button>
				</div>
			</div>

			{/* Chat overlay drawer (all breakpoints) */}
			{chatOpen && (
				<div>
					<div
						className="fixed inset-0 z-40 bg-black/30"
						onClick={() => setChatOpen(false)}
					/>
					<div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm translate-x-0 transform bg-white shadow-xl transition-transform dark:bg-gray-950">
						{/* Header */}
						<div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 text-xl font-semibold dark:border-gray-800">
							<span>Chatbot</span>
							<button
								className="text-gray-500 hover:text-gray-700"
								onClick={() => setChatOpen(false)}
							>
								✕
							</button>
						</div>

						{/* Body */}
						<div className="flex h-[calc(100%-4rem)] flex-col">
							<Chatbot />
						</div>
					</div>
				</div>
			)}


			{/* Mobile nav overlay */}
			{mobileNavOpen && (
				<div className="md:hidden">
					<div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMobileNavOpen(false)} />
					<div className="fixed inset-y-0 left-0 z-50 w-72 translate-x-0 transform bg-blue-900 p-3 text-white shadow-xl transition-transform">
						<div className="flex h-12 items-center justify-between px-2">
							<div className="font-semibold">IEMS</div>
							<button onClick={() => setMobileNavOpen(false)} className="text-blue-100">✕</button>
						</div>
						<nav className="space-y-1">
							<Link to="/dashboard" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">🏠 <span>Bảng điều khiển</span></Link>
							<Link to="/projects" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">📁 <span>Dự án</span></Link>
							<Link to="/tasks" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">✅ <span>Nhiệm vụ</span></Link>
							<Link to="/messages" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">💬 <span>Tin nhắn</span></Link>
							<Link to="/teams" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">👥 <span>Đội nhóm</span></Link>
							<Link to="/admin" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">🛠️ <span>Quản trị</span></Link>
						</nav>
					</div>
				</div>
			)}
		</div>
	);
}
