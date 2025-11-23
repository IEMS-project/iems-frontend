import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { projectService } from "../../services/projectService";
import { useErrorHandler } from "../common/ErrorBoundary";
import Skeleton from "../ui/Skeleton";
import { toast } from "sonner";

const tabs = [
    { id: "overview", label: "Tổng quan", path: "overview" },
    { id: "timeline", label: "Timeline", path: "timeline" },
    { id: "tasks", label: "Danh sách", path: "tasks" },
    { id: "members", label: "Thành viên", path: "members" },
];

export default function ProjectDetailLayout() {
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
            <div className="shrink-0 border-b border-gray-200 dark:border-gray-800 bg-background z-10">
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
                                <h1 className="text-xl font-bold truncate">{projectData?.name || '-'}</h1>
                                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                                    <span className="truncate">{projectData?.managerName || projectData?.managerEmail || projectData?.managerId || '-'}</span>
                                    <span>•</span>
                                    <Badge variant="blue" className="whitespace-nowrap">{projectData?.status || 'Chưa xác định'}</Badge>
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
                                        ${
                                            isActive
                                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        }
                                    `}
                                >
                                    {tab.label}
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

