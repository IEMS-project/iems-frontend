import React from "react";
import { FaHome, FaProjectDiagram, FaTasks, FaComments, FaUsers, FaFileAlt, FaCalendarAlt, FaUserShield, FaBell } from "react-icons/fa";
import { FaC } from "react-icons/fa6";
import { NavLink as RRNavLink } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../../theme/ThemeProvider";
import Toggle from "../ui/Toggle";

function Item({ icon, label, to, collapsed }) {
	return (
		<RRNavLink
			to={to}
			className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'}`}
		>
			<span className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-400`}>{icon}</span>
			{!collapsed && <span>{label}</span>}
		</RRNavLink>
	);
}

export default function Sidebar({ collapsed = false, onToggle }) {
	const { theme, toggleTheme } = useTheme();
	const data = {
		items: [
			{ icon: <FaHome className="h-5 w-5" />, label: "Bảng điều khiển", to: "/dashboard" },
			{ icon: <FaProjectDiagram className="h-5 w-5" />, label: "Dự án", to: "/projects" },
			{ icon: <FaTasks className="h-5 w-5" />, label: "Nhiệm vụ", to: "/tasks" },
			{ icon: <FaCalendarAlt className="h-5 w-5" />, label: "Lịch", to: "/calendar" },
			{ icon: <FaComments className="h-5 w-5" />, label: "Tin nhắn", to: "/messages" },
			{ icon: <FaBell className="h-5 w-5" />, label: "Thông báo", to: "/notifications" },
			{ icon: <FaFileAlt className="h-5 w-5" />, label: "Tài liệu", to: "/documents" },
			{ icon: <FaUsers className="h-5 w-5" />, label: "Phòng ban", to: "/teams" },
			{ icon: <FaUserShield className="h-5 w-5" />, label: "Quản trị", to: "/admin" },
		],
	};
	return (
		<aside className={`hidden shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:block ${collapsed ? 'w-20' : 'w-64'}`}>
			<div className="flex h-16 items-center gap-3 px-4">
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-base font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-100">I</div>
				{!collapsed && (
					<div>
						<div className="text-base font-semibold leading-tight text-gray-900 dark:text-gray-100">IEMS</div>
						<div className="text-xs text-gray-500 dark:text-gray-400">Intelligent EMS</div>
					</div>
				)}
			</div>
			<nav className="space-y-1 px-3 pb-4">
				{data.items.map((it, i) => (
					<Item key={i} icon={it.icon} label={it.label} to={it.to} collapsed={collapsed} />
				))}
			</nav>
			<div className="mx-3 mb-4 grid grid-cols-1 gap-2">
				<button onClick={onToggle} className="w-full rounded-md border border-gray-200 bg-white py-2 text-center text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">{collapsed ? 'Mở rộng' : 'Thu gọn'}</button>
				{collapsed ? (
					<div className="flex items-center justify-center py-2">
						<Toggle checked={theme === 'dark'} onChange={toggleTheme} aria-label="Chuyển chế độ" />
					</div>
				) : (
					<div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900">
						<div className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-200">
							{theme === 'dark' ? <FaMoon className="h-4 w-4" /> : <FaSun className="h-4 w-4" />}
							<span>Chế độ tối</span>
						</div>
						<Toggle checked={theme === 'dark'} onChange={toggleTheme} />
					</div>
				)}
			</div>
		</aside>
	);
}
