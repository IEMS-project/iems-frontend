import React, { useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaRegCalendarAlt } from "react-icons/fa";

function startOfMonth(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addMonths(date, count) {
	return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Sample tasks data - in real app this would come from props or context
const sampleTasks = [
    { id: "T-101", title: "Thiết kế kiến trúc", dueDate: "2024-10-15", priority: "Cao" },
    { id: "T-102", title: "API xác thực", dueDate: "2024-10-20", priority: "Trung bình" },
    { id: "T-103", title: "UI Dashboard", dueDate: "2024-11-01", priority: "Thấp" },
    { id: "T-104", title: "Database Schema", dueDate: "2024-10-25", priority: "Cao" },
];

export default function Calendar({ tasks = sampleTasks, onDateClick }) {
	const [current, setCurrent] = useState(startOfMonth(new Date()));
	const today = new Date();

	const grid = useMemo(() => {
		const start = startOfMonth(current);
		const end = endOfMonth(current);
		const startWeekday = (start.getDay() + 6) % 7; // Mon=0
		const daysInMonth = end.getDate();

		const cells = [];
		for (let i = 0; i < startWeekday; i++) cells.push(null);
		for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(current.getFullYear(), current.getMonth(), d));
		while (cells.length % 7 !== 0) cells.push(null);
		return cells;
	}, [current]);

	const monthLabel = current.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

	const getTasksForDate = (date) => {
		if (!date) return [];
		const dateStr = date.toISOString().split('T')[0];
		return tasks.filter(task => task.dueDate === dateStr);
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "Cao": return "bg-red-500";
			case "Trung bình": return "bg-yellow-500";
			case "Thấp": return "bg-green-500";
			default: return "bg-blue-500";
		}
	};

	const handleDateClick = (date) => {
		if (date && onDateClick) {
			onDateClick(date);
		}
	};

	return (
		<div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
			{/* Compact header */}
			<div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
				<div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
					<FaRegCalendarAlt className="h-4 w-4" />
					<span className="font-semibold capitalize">{monthLabel}</span>
				</div>
				<div className="flex items-center gap-1">
					<button aria-label="Prev" className="rounded-md border border-gray-200 p-1 text-gray-700 hover:bg-gray-50" onClick={() => setCurrent(prev => addMonths(prev, -1))}>
						<FaChevronLeft className="h-3.5 w-3.5" />
					</button>
					<button aria-label="Next" className="rounded-md border border-gray-200 p-1 text-gray-700 hover:bg-gray-50" onClick={() => setCurrent(prev => addMonths(prev, 1))}>
						<FaChevronRight className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{/* Weekdays row */}
			<div className="grid grid-cols-7 border-t border-gray-200 text-center text-[11px] font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
				{weekdays.map((w) => (
					<div key={w} className="px-2 py-1.5">{w}</div>
				))}
			</div>

			{/* Days grid */}
			<div className="grid grid-cols-7 gap-px border-t border-gray-200 bg-gray-200 dark:border-gray-800 dark:bg-gray-800">
				{grid.map((d, idx) => {
					const isToday = d && today.toDateString() === d.toDateString();
					const isWeekend = d ? d.getDay() === 0 || d.getDay() === 6 : false;
					const dayTasks = getTasksForDate(d);
					
					return (
						<div 
							key={idx} 
							className={`min-h-[60px] bg-white p-1.5 text-right text-xs dark:bg-gray-900 ${isWeekend ? 'bg-gray-50 dark:bg-gray-900/60' : ''} ${isToday ? 'outline outline-2 outline-blue-500 -outline-offset-1' : ''} ${d ? 'cursor-pointer hover:bg-gray-50' : ''}`}
							onClick={() => handleDateClick(d)}
						>
							<div className="text-right">{d ? d.getDate() : ''}</div>
							{/* Task indicators */}
							<div className="mt-1 space-y-1">
								{dayTasks.slice(0, 3).map((task, taskIdx) => (
									<div
										key={task.id}
										className={`h-1.5 w-full rounded-full ${getPriorityColor(task.priority)}`}
										title={`${task.title} (${task.priority})`}
									/>
								))}
								{dayTasks.length > 3 && (
									<div className="text-center text-[10px] text-gray-500">
										+{dayTasks.length - 3}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}