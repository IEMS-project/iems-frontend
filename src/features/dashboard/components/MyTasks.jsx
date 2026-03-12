import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useDashboard } from "@/features/dashboard/context/DashboardContext";
import Skeleton from "@/components/ui/Skeleton";
import { getTaskTypeIcon, getTaskTypeColor } from "@/features/tasks/utils/taskTypeUtils";
import { textColors, badgeColors, cn } from "@/theme/colors";

export default function MyTasks() {
	const { t } = useTranslation();
	
	// Get tasks from context instead of loading separately
	const { tasks: allTasks, tasksLoading: loading } = useDashboard();
	
	// Filter incomplete tasks
	const tasks = useMemo(() => {
		return (Array.isArray(allTasks) ? allTasks : []).filter(
			(task) => {
				const status = (task.status || "").toString().toUpperCase();
				return !["COMPLETED", "HOÀN THÀNH", "HOAN THANH", "COMPLETE"].includes(status);
			}
		);
	}, [allTasks]);

	const priorityColor = (priority) => {
		const priorityUpper = priority?.toString().toUpperCase() || "";
		if (["CAO", "HIGH"].includes(priorityUpper)) {
			return badgeColors.danger;
		}
		if (["TRUNG BÌNH", "TRUNG BINH", "MEDIUM"].includes(priorityUpper)) {
			return badgeColors.warning;
		}
		if (["THẤP", "THAP", "LOW"].includes(priorityUpper)) {
			return badgeColors.success;
		}
		return badgeColors.default;
	};

	const formatPriority = (priority) => {
		if (!priority) return t("dashboard.myTasks.na");
		const priorityUpper = priority.toString().toUpperCase();
		if (["HIGH", "CAO"].includes(priorityUpper)) return t("dashboard.priority.high");
		if (["MEDIUM", "TRUNG BÌNH", "TRUNG BINH"].includes(priorityUpper)) return t("dashboard.priority.medium");
		if (["LOW", "THẤP", "THAP"].includes(priorityUpper)) return t("dashboard.priority.low");
		return priority;
	};

	const getDueDateText = (dueDate) => {
		if (!dueDate) return t("dashboard.myTasks.noDueDate");
		try {
			const [y, m, d] = dueDate.toString().split("T")[0].split("-").map(Number);
			const dueDateOnly = new Date(y, m - 1, d);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const diffTime = dueDateOnly - today;
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays < 0) {
				return t("dashboard.myTasks.overdue", { days: Math.abs(diffDays) });
			}
			if (diffDays === 0) {
				return t("dashboard.myTasks.dueToday");
			}
			if (diffDays === 1) {
				return t("dashboard.myTasks.dueTomorrow");
			}
			return t("dashboard.myTasks.dueInDays", { days: diffDays });
		} catch {
			return t("dashboard.myTasks.na");
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("dashboard.myTasks.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-20 w-full rounded-lg" />
						))}
					</div>
				) : tasks.length === 0 ? (
					<div className={cn("py-8 text-center", textColors.muted)}>
						{t("dashboard.myTasks.noTasks")}
					</div>
				) : (
					<ul className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
						{tasks.map((task) => {
							const dueText = getDueDateText(task.dueDate);
							const isOverdue = dueText.includes(t("dashboard.myTasks.overdue", { days: "" }).split(" ")[0]) || dueText === t("dashboard.myTasks.dueToday");
							return (
								<li
									key={task.id || task.taskId}
									className={cn(
										"rounded-lg border p-4 text-sm",
										"border-gray-200  dark:border-gray-700 dark:bg-gray-800",
										textColors.primary
									)}
								>
									<div className="flex justify-between items-center">
										<div className="font-semibold text-base">
											{task.projectName || task.project?.name || t("dashboard.myTasks.na")}
										</div>
										<div
											className={cn(
												"text-xs font-semibold",
												isOverdue ? "text-red-500 dark:text-red-400" : textColors.secondary
											)}
										>
											{dueText}
										</div>
									</div>
									<div className={cn("mt-1 flex items-center justify-between text-xs", textColors.primary)}>
										<span className="flex items-center gap-1.5">
											{React.createElement(getTaskTypeIcon(task.taskType || task.type), {
												className: `w-3.5 h-3.5 ${getTaskTypeColor(task.taskType || task.type)}`
											})}
											{task.title || t("dashboard.myTasks.na")}
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