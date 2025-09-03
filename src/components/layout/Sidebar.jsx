import React from "react";
import { FaHome, FaProjectDiagram, FaTasks, FaComments, FaUsers, FaUserShield } from "react-icons/fa";

function Item({ icon, label, active, collapsed }) {
	return (
		<div className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'} `}>
			<span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${active ? ' text-blue-700' : ' text-gray-500'}`}>{icon}</span>
			{!collapsed && <span>{label}</span>}
		</div>
	);
}

export default function Sidebar({ collapsed = false, onToggle }) {
	const data = {
		items: [
			{ icon: <FaHome className="h-5 w-5" />, label: "Bảng điều khiển", active: true },
			{ icon: <FaProjectDiagram className="h-5 w-5" />, label: "Dự án" },
			{ icon: <FaTasks className="h-5 w-5" />, label: "Nhiệm vụ" },
			{ icon: <FaComments className="h-5 w-5" />, label: "Tin nhắn" },
			{ icon: <FaUsers className="h-5 w-5" />, label: "Đội nhóm" },
			{ icon: <FaUserShield className="h-5 w-5" />, label: "Quản trị" },
		],
	};
	return (
		<aside className={`hidden shrink-0 border-r border-gray-200 bg-white md:block ${collapsed ? 'w-20' : 'w-64'}`}>
			<div className="flex h-16 items-center gap-3 px-4">
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-base font-bold text-gray-800">I</div>
				{!collapsed && (
					<div>
						<div className="text-base font-semibold leading-tight text-gray-900">IEMS</div>
						<div className="text-xs text-gray-500">Intelligent EMS</div>
					</div>
				)}
			</div>
			<nav className="space-y-1 px-3 pb-4">
				{data.items.map((it, i) => (
					<Item key={i} icon={it.icon} label={it.label} active={it.active} collapsed={collapsed} />
				))}
			</nav>
			<button onClick={onToggle} className="mx-3 mb-4 w-[calc(100%-1.5rem)] rounded-md border border-gray-200 bg-white py-2 text-center text-xs text-gray-700 hover:bg-gray-50">{collapsed ? 'Mở rộng' : 'Thu gọn'}</button>
		</aside>
	);
}
