import React, { useEffect, useState, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Calendar from "@/components/ui/Calendar";
import Members from "@/features/projects/components/Members";
import ProjectRoles from "@/features/projects/components/ProjectRoles";
import { taskService } from "@/features/tasks/api/taskService";
import Skeleton from "@/components/ui/Skeleton";
import StatsCard from "@/components/ui/StatsCard";
import Progress from "@/components/ui/Progress";
import { CheckCircle2, RefreshCw, ClipboardList, AlarmClock } from "lucide-react";
import { translatePriority, translateStatus, translateWorkType } from "@/lib/i18n";

export default function ProjectOverviewPage() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const { projectData } = useOutletContext();
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setTasksLoading(true);
                const data = await taskService.getTasksByProject(projectId);
                setTasks(Array.isArray(data) ? data : []);
            } catch {
                setTasks([]);
            } finally {
                setTasksLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId]);

    // Calculate statistics
    const stats = useMemo(() => {
        const total = tasks.length;
        let completed = 0;
        let inProgress = 0;
        let todo = 0;

        tasks.forEach((task) => {
            const status = translateStatus(task.status);
            // Use normalized status for comparison
            if (status === "Hoàn thành" || status === "Completed" || status === "Done") {
                completed += 1;
            } else if (status === "Đang thực hiện" || status === "Đang duyệt" || status === "In Progress" || status === "In Review") {
                inProgress += 1;
            } else {
                todo += 1;
            }
        });

        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, inProgress, todo, progress };
    }, [tasks]);

    // Status breakdown for donut chart
    const statusBreakdown = useMemo(() => {
        const counts = {};
        const statusMap = {
            'Đang chờ': 'pending',
            'Đang thực hiện': 'inProgress',
            'Đang duyệt': 'inReview',
            'Hoàn thành': 'completed',
            'Bị chặn': 'blocked',
            'Tạm ngừng': 'onHold',
            'Đã hủy': 'cancelled',
            'Chưa xác định': 'unknown'
        };

        tasks.forEach((task) => {
            const statusRaw = translateStatus(task.status) || "Chưa xác định";
            const statusKey = statusMap[statusRaw] || 'unknown';
            const label = t(`dashboard.status.${statusKey}`);
            counts[label] = (counts[label] || 0) + 1;
        });

        // Use i18n translated labels for preferred order
        const preferredOrder = [
            t('dashboard.status.pending'),
            t('dashboard.status.inProgress'),
            t('dashboard.status.inReview'),
            t('dashboard.status.completed'),
            t('dashboard.status.blocked'),
            t('dashboard.status.onHold'),
            t('dashboard.status.cancelled'),
            t('dashboard.status.unknown')
        ];

        const ordered = {};
        preferredOrder.forEach((status) => {
            if (counts[status] !== undefined) {
                ordered[status] = counts[status];
            }
        });
        Object.entries(counts).forEach(([status, value]) => {
            if (ordered[status] === undefined) {
                ordered[status] = value;
            }
        });
        return ordered;
    }, [tasks, t]);

    // Priority breakdown
    const priorityBreakdown = useMemo(() => {
        const counts = {};
        const priorityMap = {
            'Cao nhất': 'highest',
            'Cao': 'high',
            'Trung bình': 'medium',
            'Thấp': 'low',
            'Thấp nhất': 'lowest',
            'Không ưu tiên': 'none'
        };

        tasks.forEach((task) => {
            const priorityRaw = translatePriority(task.priority) || "Không ưu tiên";
            const priorityKey = priorityMap[priorityRaw] || 'none';
            const label = t(`dashboard.priority.${priorityKey}`);
            counts[label] = (counts[label] || 0) + 1;
        });

        // Use i18n translated labels for preferred order
        const preferredOrder = [
            t('dashboard.priority.highest'),
            t('dashboard.priority.high'),
            t('dashboard.priority.medium'),
            t('dashboard.priority.low'),
            t('dashboard.priority.lowest'),
            t('dashboard.priority.none')
        ];

        const ordered = {};
        preferredOrder.forEach((priority) => {
            if (counts[priority] !== undefined) {
                ordered[priority] = counts[priority];
            }
        });
        Object.entries(counts).forEach(([priority, value]) => {
            if (ordered[priority] === undefined) {
                ordered[priority] = value;
            }
        });
        return ordered;
    }, [tasks, t]);

    // Work types breakdown
    const workTypesBreakdown = useMemo(() => {
        const counts = {};
        const taskTypeMap = {
            'Epic': 'epic',
            'Nhiệm vụ': 'task',
            'User story': 'story',
            'Lỗi': 'bug'
        };

        tasks.forEach((task) => {
            const typeRaw = translateWorkType(task.taskType) || "Nhiệm vụ";
            const typeKey = taskTypeMap[typeRaw] || 'task';
            const label = t(`projects.detail.tasks.taskTypes.${typeKey}`);
            counts[label] = (counts[label] || 0) + 1;
        });

        const total = tasks.length;
        return Object.entries(counts).map(([type, count]) => ({
            type,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
    }, [tasks, t]);

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
                {tasksLoading ? (
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
                            {tasksLoading ? (
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

                                                    const colors = {};
                                                    // Build color map with translated keys
                                                    colors[t('dashboard.status.pending')] = "#3b82f6";
                                                    colors[t('dashboard.status.inProgress')] = "#8b5cf6";
                                                    colors[t('dashboard.status.inReview')] = "#06b6d4";
                                                    colors[t('dashboard.status.completed')] = "#10b981";
                                                    colors[t('dashboard.status.blocked')] = "#f97316";
                                                    colors[t('dashboard.status.onHold')] = "#facc15";
                                                    colors[t('dashboard.status.cancelled')] = "#6b7280";

                                                    return (
                                                        <circle
                                                            key={status}
                                                            cx="96"
                                                            cy="96"
                                                            r="80"
                                                            fill="none"
                                                            stroke={colors[status] || "#9ca3af"}
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
                                            const colors = {};
                                            // Build color map with translated keys
                                            colors[t('dashboard.status.pending')] = "bg-blue-500";
                                            colors[t('dashboard.status.inProgress')] = "bg-purple-500";
                                            colors[t('dashboard.status.inReview')] = "bg-cyan-500";
                                            colors[t('dashboard.status.completed')] = "bg-green-500";
                                            colors[t('dashboard.status.blocked')] = "bg-orange-500";
                                            colors[t('dashboard.status.onHold')] = "bg-amber-400";
                                            colors[t('dashboard.status.cancelled')] = "bg-gray-500";

                                            return (
                                                <div key={status} className="flex items-center gap-2">
                                                    <div className={`h-3 w-3 rounded-full ${colors[status] || "bg-gray-500"}`} />
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
                            {tasksLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(priorityBreakdown).map(([priority, count]) => (
                                        <div key={priority} className="flex items-center justify-between">
                                            <span className="text-sm text-foreground">{priority}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 bg-blue-500 dark:bg-blue-400 rounded" style={{ width: `${(count / Math.max(...Object.values(priorityBreakdown), 1)) * 200}px` }} />
                                                <span className="text-sm font-medium w-8 text-right text-foreground">{count}</span>
                                            </div>
                                        </div>
                                    ))}
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
                            {tasksLoading ? (
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

