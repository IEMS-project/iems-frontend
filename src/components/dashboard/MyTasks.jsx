import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { taskService } from "../../services/taskService";
import Skeleton from "../ui/Skeleton";
import { getTaskTypeIcon, getTaskTypeColor } from "../../lib/taskTypeUtils";

export default function MyTasks() {
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadTasks = async () => {
			try {
				setLoading(true);
				const data = await taskService.getMyTasks();
				setTasks(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error("Error loading tasks:", error);
				setTasks([]);
			} finally {
				setLoading(false);
			}
		};

		loadTasks();
	}, []);

	const priorityColor = (priority) => {
		const priorityUpper = priority?.toString().toUpperCase() || "";
		if (["CAO", "HIGH"].includes(priorityUpper)) {
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
		}
		if (["TRUNG BÌNH", "TRUNG BINH", "MEDIUM"].includes(priorityUpper)) {
			return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
		}
		if (["THẤP", "THAP", "LOW"].includes(priorityUpper)) {
			return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
		}
		return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
	};

	const formatPriority = (priority) => {
		if (!priority) return "N/A";
		const priorityUpper = priority.toString().toUpperCase();
		if (["HIGH", "CAO"].includes(priorityUpper)) return "Cao";
		if (["MEDIUM", "TRUNG BÌNH", "TRUNG BINH"].includes(priorityUpper)) return "Trung bình";
		if (["LOW", "THẤP", "THAP"].includes(priorityUpper)) return "Thấp";
		return priority;
	};

	const getDueDateText = (dueDate) => {
		if (!dueDate) return "Không có hạn";
		try {
			const due = new Date(dueDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
			const diffTime = dueDateOnly - today;
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays < 0) {
				return `Quá hạn ${Math.abs(diffDays)} ngày`;
			}
			if (diffDays === 0) {
				return "Hạn hôm nay";
			}
			if (diffDays === 1) {
				return "Hạn ngày mai";
			}
			return `Hạn trong ${diffDays} ngày`;
		} catch {
			return "N/A";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Nhiệm vụ của tôi</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-20 w-full rounded-lg" />
						))}
					</div>
				) : tasks.length === 0 ? (
					<div className="py-8 text-center text-gray-500 dark:text-gray-400">
						Không có nhiệm vụ nào
					</div>
				) : (
					<ul className="space-y-3">
						{tasks.map((task) => {
							const dueText = getDueDateText(task.dueDate);
							const isOverdue = dueText.includes("Quá hạn") || dueText.includes("Hạn hôm nay");
							return (
								<li
									key={task.id || task.taskId}
									className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-black dark:text-white dark:border-blue-800 dark:bg-blue-900/20"
								>
									<div className="flex justify-between items-center">
										<div className="font-semibold text-base">
											{task.projectName || task.project?.name || "N/A"}
										</div>
										<div
											className={`text-xs font-semibold ${isOverdue ? "text-red-500" : "text-gray-600 dark:text-gray-400"
												}`}
										>
											{dueText}
										</div>
									</div>
									<div className="mt-1 flex items-center justify-between text-xs text-black dark:text-white">
										<span className="flex items-center gap-1.5">
											{React.createElement(getTaskTypeIcon(task.taskType || task.type), {
												className: `w-3.5 h-3.5 ${getTaskTypeColor(task.taskType || task.type)}`
											})}
											{task.title || "N/A"}
										</span>
										<span
											className={`rounded px-2 py-0.5 text-[10px] font-semibold ${priorityColor(
												task.priority
											)}`}
										>
											{formatPriority(task.priority)}
										</span>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}