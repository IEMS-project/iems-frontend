import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

export default function Calendar({ onDateClick, projectId }) {
	const { t, i18n } = useTranslation();
	const [current, setCurrent] = useState(startOfMonth(new Date()));
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);
	const today = new Date();

	const weekdays = useMemo(() => [
		t("dashboard.calendar.weekdays.monday"),
		t("dashboard.calendar.weekdays.tuesday"),
		t("dashboard.calendar.weekdays.wednesday"),
		t("dashboard.calendar.weekdays.thursday"),
		t("dashboard.calendar.weekdays.friday"),
		t("dashboard.calendar.weekdays.saturday"),
		t("dashboard.calendar.weekdays.sunday")
	], [t]);

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
				// Lọc các task đang Đang chờ (status không phải COMPLETED)
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

	const monthLabel = current.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN', { month: "long", year: "numeric" });

	// Format a Date object as "YYYY-MM-DD" using local timezone
	const toLocalDateStr = (date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	// Hàm lấy tất cả các ngày trong khoảng từ startDate đến endDate
	const getDatesInRange = (startDateStr, endDateStr) => {
		if (!startDateStr && !endDateStr) return [];

		// Parse date strings directly to avoid UTC shift
		const parseDate = (str) => {
			if (!str) return null;
			const [y, m, d] = str.split("T")[0].split("-").map(Number);
			return new Date(y, m - 1, d);
		};

		const start = parseDate(startDateStr);
		const end = parseDate(endDateStr);

		// Nếu chỉ có startDate, chỉ tính ngày đó
		if (start && !end) {
			return [toLocalDateStr(start)];
		}

		// Nếu chỉ có endDate/dueDate, chỉ tính ngày đó
		if (!start && end) {
			return [toLocalDateStr(end)];
		}

		// Nếu có cả hai, tính tất cả ngày trong khoảng
		if (start && end) {
			const dates = [];
			const current = new Date(start);
			const endDate = new Date(end);

			// Đảm bảo start <= end
			if (current > endDate) {
				return [toLocalDateStr(end)];
			}

			while (current <= endDate) {
				dates.push(toLocalDateStr(current));
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
		const dateStr = toLocalDateStr(date);
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
				const dateStr = toLocalDateStr(date);
				const counts = tasksByDate[dateStr] || { high: 0, medium: 0, low: 0 };
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
		<div className="rounded-lg border border-border bg-card shadow-sm text-foreground">
			{/* Compact header */}
			<div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm">
				<div className="flex items-center gap-2 text-foreground">
					<FaRegCalendarAlt className="h-4 w-4" />
					<span className="font-semibold capitalize">{monthLabel}</span>
				</div>
				<div className="flex items-center gap-1">
					<button aria-label={t("dashboard.calendar.prevMonth")} className="rounded-md border border-border p-1 text-foreground hover:bg-muted/80" onClick={() => setCurrent(prev => addMonths(prev, -1))}>
						<FaChevronLeft className="h-3.5 w-3.5" />
					</button>
					<button aria-label={t("dashboard.calendar.nextMonth")} className="rounded-md border border-border p-1 text-foreground hover:bg-muted/80" onClick={() => setCurrent(prev => addMonths(prev, 1))}>
						<FaChevronRight className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{/* Weekdays row */}
			<div className="grid grid-cols-7 border-t border-border text-center text-[11px] font-medium text-muted-foreground">
				{weekdays.map((w) => (
					<div key={w} className="px-2 py-1.5">{w}</div>
				))}
			</div>

			{/* Days grid */}
			<div className="grid grid-cols-7 gap-px border-t border-border bg-border/40">
				{grid.map((d, idx) => {
					const isToday = d && today.toDateString() === d.toDateString();
					const isWeekend = d ? d.getDay() === 0 || d.getDay() === 6 : false;
					const intensity = getHeatmapIntensity(d);
					const heatmapColor = getHeatmapColor(intensity);

					return (
						<div
							key={idx}
							className={`min-h-[60px] p-1.5 text-right text-xs transition-colors ${loading
								? 'bg-background animate-pulse'
								: heatmapColor || (isWeekend ? 'bg-muted/50' : 'bg-background')
								} ${isToday ? 'outline outline-2 outline-blue-500 -outline-offset-1' : ''} ${d ? 'cursor-pointer hover:opacity-80' : ''}`}
							onClick={() => handleDateClick(d)}
						>
							<div className={`text-right ${isToday
								? 'font-bold text-blue-500 dark:text-blue-400'
								: intensity > 0
									? (intensity / maxIntensity >= 0.15 ? 'text-white' : 'text-foreground')
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