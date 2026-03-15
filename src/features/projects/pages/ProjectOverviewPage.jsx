import React, { useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Calendar from "@/components/ui/Calendar";
import Members from "@/features/projects/components/Members";
import ProjectRoles from "@/features/projects/components/ProjectRoles";
import { useProject } from "@/features/projects/context/ProjectContext";
import Skeleton from "@/components/ui/Skeleton";
import StatsCard from "@/components/ui/StatsCard";
import Progress from "@/components/ui/Progress";
import { CheckCircle2, RefreshCw, ClipboardList, AlarmClock } from "lucide-react";

export default function ProjectOverviewPage() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const { projectData } = useOutletContext();
    
    // Get issues from context
    const { issues = [], issuesLoading, workflowStatuses = [], issuePriorities = [], issueTypes = [] } = useProject();

    // Calculate statistics
    const stats = useMemo(() => {
        const total = issues.length;
        let completed = 0;
        let inProgress = 0;
        let todo = 0;

        issues.forEach((issue) => {
            const statusObj = workflowStatuses.find(s => s.id === issue.statusId);
            const category = statusObj?.category || 'TODO';
            if (category === 'DONE') {
                completed += 1;
            } else if (category === 'IN_PROGRESS') {
                inProgress += 1;
            } else {
                todo += 1;
            }
        });

        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, inProgress, todo, progress };
    }, [issues, workflowStatuses]);

    // Status breakdown for donut chart
    const statusBreakdown = useMemo(() => {
        const counts = {};
        
        issues.forEach((issue) => {
            const statusObj = workflowStatuses.find(s => s.id === issue.statusId);
            const label = statusObj ? statusObj.name : 'Unknown';
            counts[label] = (counts[label] || 0) + 1;
        });

        return counts;
    }, [issues, workflowStatuses]);

    // Priority breakdown
    const priorityBreakdown = useMemo(() => {
        const counts = {};
        
        issues.forEach((issue) => {
            const priorityObj = issuePriorities.find(p => p.id === issue.priorityId);
            const label = priorityObj ? priorityObj.name : 'None';
            counts[label] = (counts[label] || 0) + 1;
        });

        return counts;
    }, [issues, issuePriorities]);

    // Work types breakdown
    const workTypesBreakdown = useMemo(() => {
        const counts = {};
        
        issues.forEach((issue) => {
            const typeObj = issueTypes.find(t => t.id === issue.issueTypeId);
            const label = typeObj ? typeObj.name : 'Task';
            counts[label] = (counts[label] || 0) + 1;
        });

        const total = issues.length;
        return Object.entries(counts).map(([type, count]) => ({
            type,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
    }, [issues, issueTypes]);

    return (
        <div className="space-y-6">
            {/* Project Description */}
            {projectData && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('projects.form.description')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground">
                            {projectData.description || t('projects.detail.overview.noData')}
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <div className="text-xs uppercase text-muted-foreground">{t('projects.form.startDate')}</div>
                                <div className="text-foreground">
                                    {projectData.startDate
                                        ? (() => { const [y,m,d] = projectData.startDate.split("T")[0].split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString('vi-VN'); })()
                                        : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-muted-foreground">{t('projects.form.endDate')}</div>
                                <div className="text-foreground">
                                    {projectData.endDate
                                        ? (() => { const [y,m,d] = projectData.endDate.split("T")[0].split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString('vi-VN'); })()
                                        : '-'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {issuesLoading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title={t('projects.detail.overview.statistics.completed')}
                            value={stats.completed}
                            helper={t('projects.detail.tasks.empty').replace(t('projects.detail.tasks.empty'), `${t('ui.common.of')} ${stats.total} ${t('projects.detail.tasks.title').toLowerCase()}`)}
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            accent="green"
                        />
                        <StatsCard
                            title={t('projects.detail.overview.statistics.inProgress')}
                            value={stats.inProgress}
                            helper={t('ui.common.processing')}
                            icon={<RefreshCw className="h-5 w-5" />}
                            accent="purple"
                        />
                        <StatsCard
                            title={t('projects.detail.overview.statistics.totalTasks')}
                            value={stats.total}
                            helper={t('ui.common.created')}
                            icon={<ClipboardList className="h-5 w-5" />}
                            accent="blue"
                        />
                        <StatsCard
                            title={t('ui.common.dueSoon')}
                            value={0}
                            helper={t('ui.common.inNext7Days')}
                            icon={<AlarmClock className="h-5 w-5" />}
                            accent="orange"
                        />
                    </>
                )}
            </div>

            {/* Progress Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('projects.detail.overview.statistics.completionRate')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">{t('projects.detail.overview.statistics.completionRate')}</span>
                                <span className="text-sm text-muted-foreground">
                                    {projectData?.progress ?? stats.progress}%
                                </span>
                            </div>
                            <Progress value={projectData?.progress ?? stats.progress} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    {/* Status Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('projects.detail.overview.charts.statusBreakdown')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {issuesLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center">
                                        <div className="relative h-48 w-48">
                                            <svg className="h-48 w-48 transform -rotate-90">
                                                <circle
                                                    cx="96"
                                                    cy="96"
                                                    r="80"
                                                    fill="none"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="16"
                                                />
                                                {Object.entries(statusBreakdown).map(([status, count], idx) => {
                                                    const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);
                                                    const percentage = total > 0 ? (count / total) * 100 : 0;
                                                    const offset = Object.entries(statusBreakdown)
                                                        .slice(0, idx)
                                                        .reduce((sum, [, c]) => {
                                                            const p = total > 0 ? (c / total) * 100 : 0;
                                                            return sum + (p / 100) * 502.4;
                                                        }, 0);

                                                    const statusObj = workflowStatuses.find(s => s.name === status);

                                                    return (
                                                        <circle
                                                            key={status}
                                                            cx="96"
                                                            cy="96"
                                                            r="80"
                                                            fill="none"
                                                            stroke={statusObj?.color || "#9ca3af"}
                                                            strokeWidth="16"
                                                            strokeDasharray={`${(percentage / 100) * 502.4} 502.4`}
                                                            strokeDashoffset={-offset}
                                                        />
                                                    );
                                                })}
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                                                    <div className="text-xs text-muted-foreground">{t('projects.detail.overview.statistics.totalTasks')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(statusBreakdown).map(([status, count]) => {
                                            const statusObj = workflowStatuses.find(s => s.name === status);
                                            return (
                                                <div key={status} className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: statusObj?.color || "#9ca3af" }} />
                                                    <span className="text-sm text-foreground">{status}: {count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Priority Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('projects.detail.overview.charts.priorityBreakdown')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {issuesLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(priorityBreakdown).map(([priority, count]) => {
                                        const pObj = issuePriorities.find(p => p.name === priority);
                                        return (
                                        <div key={priority} className="flex items-center justify-between">
                                            <span className="text-sm text-foreground">{priority}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 rounded" style={{ width: `${(count / Math.max(...Object.values(priorityBreakdown), 1)) * 200}px`, backgroundColor: pObj?.color || "#3b82f6" }} />
                                                <span className="text-sm font-medium w-8 text-right text-foreground">{count}</span>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Work Types */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('projects.detail.overview.charts.workTypesBreakdown')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {issuesLoading ? (
                                <Skeleton className="h-32 w-full" />
                            ) : (
                                <div className="space-y-3">
                                    {workTypesBreakdown.map(({ type, count, percentage }) => (
                                        <div key={type}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-foreground">{type}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {percentage}% • {count}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Heatmap Calendar */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.calendar.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar projectId={projectId} />
                        </CardContent>
                    </Card>

                    {/* Members */}
                    <Members />

                    {/* Roles */}
                    <ProjectRoles />
                </div>
            </div>
        </div>
    );
}
