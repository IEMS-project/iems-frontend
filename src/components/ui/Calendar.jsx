import React, { useMemo, useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaRegCalendarAlt } from "react-icons/fa";
import { taskService } from "../../services/taskService";

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

export default function Calendar({ onDateClick, projectId }) {
	const [current, setCurrent] = useState(startOfMonth(new Date()));
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);
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

	useEffect(() => {
		const loadTasks = async () => {
			try {
				setLoading(true);
				// Nếu có projectId thì chỉ load task của project đó, nếu không thì load tất cả task
				const data = projectId 
					? await taskService.getTasksByProject(projectId)
					: await taskService.getMyTasks();
				// Lọc các task đang chờ (status không phải COMPLETED)
				const pendingTasks = (Array.isArray(data) ? data : []).filter(
					(task) => task.status?.toUpperCase() !== "COMPLETED"
				);
				setTasks(pendingTasks);
			} catch (error) {
				console.error("Error loading tasks for calendar:", error);
				setTasks([]);
			} finally {
				setLoading(false);
			}
		};

		loadTasks();
	}, [projectId]);

	const monthLabel = current.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

	// Hàm lấy tất cả các ngày trong khoảng từ startDate đến endDate
	const getDatesInRange = (startDateStr, endDateStr) => {
		if (!startDateStr && !endDateStr) return [];
		
		const start = startDateStr ? new Date(startDateStr.split("T")[0]) : null;
		const end = endDateStr ? new Date(endDateStr.split("T")[0]) : null;
		
		// Nếu chỉ có startDate, chỉ tính ngày đó
		if (start && !end) {
			return [start.toISOString().split("T")[0]];
		}
		
		// Nếu chỉ có endDate/dueDate, chỉ tính ngày đó
		if (!start && end) {
			return [end.toISOString().split("T")[0]];
		}
		
		// Nếu có cả hai, tính tất cả ngày trong khoảng
		if (start && end) {
			const dates = [];
			const current = new Date(start);
			const endDate = new Date(end);
			
			// Đảm bảo start <= end
			if (current > endDate) {
				return [end.toISOString().split("T")[0]];
			}
			
			while (current <= endDate) {
				dates.push(current.toISOString().split("T")[0]);
				current.setDate(current.getDate() + 1);
			}
			return dates;
		}
		
		return [];
	};

	// Nhóm tasks theo ngày và đếm theo priority
	const tasksByDate = useMemo(() => {
		const grouped = {};
		tasks.forEach((task) => {
			const startDate = task.startDate;
			const endDate = task.endDate || task.dueDate;
			
			// Lấy tất cả các ngày trong khoảng
			const dateStrings = getDatesInRange(startDate, endDate);
			
			if (dateStrings.length === 0) return;

			const priority = task.priority?.toString().toUpperCase() || "";
			let priorityType = null;
			if (["HIGH", "CAO"].includes(priority)) {
				priorityType = "high";
			} else if (["MEDIUM", "TRUNG BÌNH", "TRUNG BINH"].includes(priority)) {
				priorityType = "medium";
			} else if (["LOW", "THẤP", "THAP"].includes(priority)) {
				priorityType = "low";
			}
			
			if (!priorityType) return;

			// Đếm task cho tất cả các ngày trong khoảng
			dateStrings.forEach((dateStr) => {
				if (!grouped[dateStr]) {
					grouped[dateStr] = { high: 0, medium: 0, low: 0 };
				}
				grouped[dateStr][priorityType]++;
			});
		});
		return grouped;
	}, [tasks]);

	const getTasksCountForDate = (date) => {
		if (!date) return { high: 0, medium: 0, low: 0 };
		const dateStr = date.toISOString().split("T")[0];
		return tasksByDate[dateStr] || { high: 0, medium: 0, low: 0 };
	};

	// Tính heatmap intensity dựa trên số lượng task (weighted: high=3, medium=2, low=1)
	const getHeatmapIntensity = (date) => {
		if (!date) return 0;
		const counts = getTasksCountForDate(date);
		const weightedScore = counts.high * 3 + counts.medium * 2 + counts.low * 1;
		return weightedScore;
	};

	// Tìm max intensity trong tháng để normalize
	const maxIntensity = useMemo(() => {
		let max = 0;
		grid.forEach((date) => {
			if (date) {
				const counts = getTasksCountForDate(date);
				const score = counts.high * 3 + counts.medium * 2 + counts.low * 1;
				if (score > max) max = score;
			}
		});
		return max || 1; // Tránh chia cho 0
	}, [grid, tasksByDate]);

	// Lấy màu heatmap dựa trên intensity với nhiều mức độ màu hơn
	const getHeatmapColor = (intensity) => {
		if (intensity === 0) return "";
		
		const normalized = intensity / maxIntensity;
		
		// Nhiều mức độ màu từ nhạt đến đậm
		if (normalized >= 0.9) return "bg-red-700 dark:bg-red-800"; // Đỏ rất đậm
		if (normalized >= 0.8) return "bg-red-600 dark:bg-red-700"; // Đỏ đậm
		if (normalized >= 0.7) return "bg-red-500 dark:bg-red-600"; // Đỏ
		if (normalized >= 0.6) return "bg-red-400 dark:bg-red-500"; // Đỏ nhạt
		if (normalized >= 0.5) return "bg-orange-500 dark:bg-orange-600"; // Cam đậm
		if (normalized >= 0.4) return "bg-orange-400 dark:bg-orange-500"; // Cam
		if (normalized >= 0.3) return "bg-yellow-500 dark:bg-yellow-600"; // Vàng đậm
		if (normalized >= 0.2) return "bg-yellow-400 dark:bg-yellow-500"; // Vàng
		if (normalized >= 0.15) return "bg-yellow-300 dark:bg-yellow-400"; // Vàng nhạt
		if (normalized >= 0.1) return "bg-green-400 dark:bg-green-500"; // Xanh lá đậm
		if (normalized >= 0.05) return "bg-green-300 dark:bg-green-400"; // Xanh lá
		return "bg-green-200 dark:bg-green-300"; // Xanh lá nhạt
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
					const intensity = getHeatmapIntensity(d);
					const heatmapColor = getHeatmapColor(intensity);
					
					return (
						<div 
							key={idx} 
							className={`min-h-[60px] p-1.5 text-right text-xs transition-colors ${
								loading 
									? 'bg-white dark:bg-gray-900 animate-pulse' 
									: heatmapColor || (isWeekend ? 'bg-gray-50 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900')
							} ${isToday ? 'outline outline-2 outline-blue-500 -outline-offset-1' : ''} ${d ? 'cursor-pointer hover:opacity-80' : ''}`}
							onClick={() => handleDateClick(d)}
						>
							<div className={`text-right ${
								isToday 
									? 'font-bold text-blue-600 dark:text-blue-400' 
									: intensity > 0 
										? (intensity / maxIntensity >= 0.15 ? 'text-white' : 'text-gray-800 dark:text-gray-200')
										: ''
							}`}>
								{d ? d.getDate() : ''}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}