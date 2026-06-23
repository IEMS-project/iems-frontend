import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderKanban } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDashboard } from "@/features/dashboard/context/DashboardContext";
import Skeleton from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import ProjectOverviewTable from "@/features/dashboard/components/ProjectOverviewTable";

const PAGE_SIZE = 4;

export default function ProjectOverview() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { projects, projectsLoading: loading } = useDashboard();
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pagedProjects = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return projects.slice(start, start + PAGE_SIZE);
    }, [currentPage, projects]);

    const formatDate = (dateString) => {
        if (!dateString) return t("dashboard.projectOverview.na");
        try {
            return new Date(dateString).toLocaleDateString();
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
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
                <SectionHeader
                    icon={FolderKanban}
                    title={t("dashboard.projectOverview.title")}
                />
            </CardHeader>
            <CardContent className="pt-0">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_9rem_8rem_7rem] md:gap-4">
                                <Skeleton className="h-10" />
                                <Skeleton className="h-10" />
                                <Skeleton className="h-10" />
                                <Skeleton className="h-10" />
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <EmptyState
                        icon={FolderKanban}
                        title={t("dashboard.projectOverview.noProjects")}
                    />
                ) : (
                    <div className="space-y-4">
                        <ProjectOverviewTable
                            projects={pagedProjects}
                            labels={{
                                project: t("dashboard.projectOverview.project"),
                                status: t("dashboard.projectOverview.status"),
                                deadline: t("dashboard.projectOverview.deadline"),
                                na: t("dashboard.projectOverview.na"),
                            }}
                            formatStatus={formatStatus}
                            formatDate={formatDate}
                            onProjectClick={handleProjectClick}
                        />
                        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                                {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, projects.length)} / {projects.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t("ui.pagination.previous")}
                                </button>
                                <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
                                    {currentPage}/{totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t("ui.pagination.next")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
