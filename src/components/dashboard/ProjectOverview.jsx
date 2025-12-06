import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { projectService } from "../../services/projectService";
import Skeleton from "../ui/Skeleton";
import { textColors, borderColors, bgColors, cn } from "../../theme/colors";

export default function ProjectOverview() {
	const { t } = useTranslation();
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const loadProjects = async () => {
			try {
				setLoading(true);
				const data = await projectService.getMyProjects();
				setProjects(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error("Error loading projects:", error);
				setProjects([]);
			} finally {
				setLoading(false);
			}
		};

		loadProjects();
	}, []);

	const formatDate = (dateString) => {
		if (!dateString) return t("dashboard.projectOverview.na");
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString();
		} catch {
			return dateString;
		}
	};

	const formatStatus = (status) => {
		if (!status) return t("dashboard.projectOverview.na");
		const statusMap = {
			PLANNING: t("dashboard.status.planning"),
			IN_PROGRESS: t("dashboard.status.inProgress"),
			COMPLETED: t("dashboard.status.completed"),
			ON_HOLD: t("dashboard.status.onHold"),
			REVIEW: t("dashboard.status.review"),
		};
		return statusMap[status] || status;
	};

	const handleProjectClick = (projectId) => {
		if (projectId) {
			navigate(`/projects/${projectId}/overview`);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("dashboard.projectOverview.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex gap-4">
								<Skeleton className="h-10 flex-1" />
								<Skeleton className="h-10 w-32" />
								<Skeleton className="h-10 w-32" />
								<Skeleton className="h-10 w-24" />
							</div>
						))}
					</div>
				) : projects.length === 0 ? (
					<div className={cn("py-8 text-center", textColors.muted)}>
						{t("dashboard.projectOverview.noProjects")}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className={cn("min-w-full text-sm", borderColors.divider)}>
							<thead>
								<tr className={cn("text-left", textColors.secondary)}>
									<th className="px-4 py-2 font-medium">{t("dashboard.projectOverview.project")}</th>
									<th className="px-4 py-2 font-medium">{t("dashboard.projectOverview.status")}</th>
									<th className="px-4 py-2 font-medium">{t("dashboard.projectOverview.deadline")}</th>
									<th className="px-4 py-2 font-medium">{t("dashboard.projectOverview.progress")}</th>
								</tr>
							</thead>
							<tbody className={borderColors.divider}>
								{projects.map((project) => (
									<tr
										key={project.id || project.projectId}
										onClick={() => handleProjectClick(project.id || project.projectId)}
										className={cn(bgColors.hover, "cursor-pointer transition-colors")}
									>
										<td className={cn("px-4 py-3 font-medium", textColors.primary)}>
											{project.name || project.title || t("dashboard.projectOverview.na")}
										</td>
										<td className="px-4 py-3">{formatStatus(project.status)}</td>
										<td className="px-4 py-3">
											{formatDate(project.endDate || project.dueDate || project.due)}
										</td>
										<td className="px-4 py-3">
											{project.progress !== undefined && project.progress !== null
												? `${project.progress}%`
												: t("dashboard.projectOverview.na")}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
