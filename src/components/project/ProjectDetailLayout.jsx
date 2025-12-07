import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { projectService } from "../../services/projectService";
import { useErrorHandler } from "../common/ErrorBoundary";
import Skeleton from "../ui/Skeleton";
import { toast } from "sonner";
import { getStatusTranslationKey } from "../../lib/i18n";

const tabs = [
    { id: "overview", label: "overview", path: "overview" },
    { id: "timeline", label: "timeline", path: "timeline" },
    { id: "phases", label: "phases", path: "phases" },
    { id: "tasks", label: "tasks", path: "tasks" },
    { id: "members", label: "members", path: "members" },
];

export default function ProjectDetailLayout() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { handleError } = useErrorHandler();
    const [loading, setLoading] = useState(true);
    const [projectData, setProjectData] = useState(null);

    // Determine current tab from path
    const currentTab = React.useMemo(() => {
        const path = location.pathname;
        if (path.includes("/members")) return "members";
        if (path.includes("/tasks")) return "tasks";
        if (path.includes("/timeline")) return "timeline";
        if (path.includes("/phases")) return "phases";
        return "overview";
    }, [location.pathname]);

    // Only load project data once when projectId changes, not on tab changes
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await projectService.getProjectById(projectId);

                if (data && data.status === "error" &&
                    (data.message?.includes("Permission denied") ||
                        data.message?.includes("PERMISSION_DENIED"))) {
                    navigate("/permission-denied");
                    return;
                }

                setProjectData(data);
            } catch (e) {
                if (e.status === 403 ||
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    navigate("/permission-denied");
                    return;
                } else {
                    handleError(e);
                }
            } finally {
                setLoading(false);
            }
        };
        if (projectId) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]); // Only reload when projectId changes, not on tab navigation

    const handleTabClick = (tabPath) => {
        navigate(`/projects/${projectId}/${tabPath}`);
    };


    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Project Header with Tab Navigation - Fixed */}
            <div className="shrink-0 border-b border-border bg-background z-10">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                    {/* Project Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {loading && !projectData ? (
                            <div className="flex items-center gap-3 min-w-0">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-xl font-bold truncate text-foreground">{projectData?.name || '-'}</h1>
                                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className=" text-xl font-bold ">-</span>
                                    <Badge variant="blue" className="whitespace-nowrap">
                                        {projectData?.status ? t(getStatusTranslationKey(projectData.status)) : t('dashboard.status.unknown')}
                                    </Badge>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <nav className="flex items-center gap-1" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const isActive = currentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.path)}
                                    className={`
                                        whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors
                                        ${isActive
                                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                                        }
                                    `}
                                >
                                    {t(`projects.detail.tabs.${tab.label}`)}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Page Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <Outlet context={{ projectData, loading }} />
                </div>
            </div>
        </div>
    );
}

