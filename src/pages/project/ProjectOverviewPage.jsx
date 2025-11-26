import React, { useEffect, useState, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import Calendar from "../../components/ui/Calendar";
import Members from "../../components/project/Members";
import ProjectRoles from "../../components/project/ProjectRoles";
import { taskService } from "../../services/taskService";
import Skeleton from "../../components/ui/Skeleton";
import StatsCard from "../../components/ui/StatsCard";
import Progress from "../../components/ui/Progress";
import { CheckCircle2, RefreshCw, ClipboardList, AlarmClock } from "lucide-react";
import { translatePriority, translateStatus, translateWorkType } from "../../lib/i18n";

export default function ProjectOverviewPage() {
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
            if (status === "Hoàn thành") {
                completed += 1;
            } else if (status === "Đang thực hiện" || status === "Đang duyệt") {
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
        tasks.forEach((task) => {
            const label = translateStatus(task.status) || "Chưa xác định";
            counts[label] = (counts[label] || 0) + 1;
        });
        const preferredOrder = ["Đang chờ", "Đang thực hiện", "Đang duyệt", "Hoàn thành", "Bị chặn", "Tạm ngừng", "Đã hủy", "Chưa xác định"];
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
    }, [tasks]);

    // Priority breakdown
    const priorityBreakdown = useMemo(() => {
        const counts = {};
        tasks.forEach((task) => {
            const label = translatePriority(task.priority) || "Không ưu tiên";
            counts[label] = (counts[label] || 0) + 1;
        });
        const preferredOrder = ["Cao nhất", "Cao", "Trung bình", "Thấp", "Thấp nhất", "Không ưu tiên"];
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
    }, [tasks]);

    // Work types breakdown
    const workTypesBreakdown = useMemo(() => {
        const counts = {};
        tasks.forEach((task) => {
            const label = translateWorkType(task.taskType) || "Nhiệm vụ";
            counts[label] = (counts[label] || 0) + 1;
        });
        const total = tasks.length;
        return Object.entries(counts).map(([type, count]) => ({
            type,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
    }, [tasks]);

    return (
        <div className="space-y-6">
            {/* Project Description */}
            {projectData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mô tả dự án</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 dark:text-gray-300">
                            {projectData.description || "Chưa có mô tả"}
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <div className="text-xs uppercase text-gray-500">Ngày bắt đầu</div>
                                <div className="text-gray-800 dark:text-gray-100">
                                    {projectData.startDate
                                        ? new Date(projectData.startDate).toLocaleDateString('vi-VN')
                                        : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-gray-500">Hạn hoàn thành</div>
                                <div className="text-gray-800 dark:text-gray-100">
                                    {projectData.endDate
                                        ? new Date(projectData.endDate).toLocaleDateString('vi-VN')
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
                            title="Hoàn thành"
                            value={stats.completed}
                            helper={`trong ${stats.total} nhiệm vụ`}
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            accent="green"
                        />
                        <StatsCard
                            title="Đang thực hiện"
                            value={stats.inProgress}
                            helper="đang xử lý"
                            icon={<RefreshCw className="h-5 w-5" />}
                            accent="purple"
                        />
                        <StatsCard
                            title="Tổng nhiệm vụ"
                            value={stats.total}
                            helper="đã tạo"
                            icon={<ClipboardList className="h-5 w-5" />}
                            accent="blue"
                        />
                        <StatsCard
                            title="Sắp đến hạn"
                            value={0}
                            helper="trong 7 ngày tới"
                            icon={<AlarmClock className="h-5 w-5" />}
                            accent="orange"
                        />
                    </>
                )}
            </div>

            {/* Progress Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Tổng quan tiến độ</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Tiến độ hoàn thành</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
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
                            <CardTitle>Phân bổ trạng thái</CardTitle>
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

                                                    const colors = {
                                                        "Đang chờ": "#3b82f6",
                                                        "Đang thực hiện": "#8b5cf6",
                                                        "Đang duyệt": "#06b6d4",
                                                        "Hoàn thành": "#10b981",
                                                        "Bị chặn": "#f97316",
                                                        "Tạm ngừng": "#facc15",
                                                        "Đã hủy": "#6b7280",
                                                    };

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
                                                    <div className="text-2xl font-bold">{stats.total}</div>
                                                    <div className="text-xs text-gray-500">Tổng số</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(statusBreakdown).map(([status, count]) => {
                                            const colors = {
                                                "Đang chờ": "bg-blue-500",
                                                "Đang thực hiện": "bg-purple-500",
                                                "Đang duyệt": "bg-cyan-500",
                                                "Hoàn thành": "bg-green-500",
                                                "Bị chặn": "bg-orange-500",
                                                "Tạm ngừng": "bg-amber-400",
                                                "Đã hủy": "bg-gray-500",
                                            };
                                            return (
                                                <div key={status} className="flex items-center gap-2">
                                                    <div className={`h-3 w-3 rounded-full ${colors[status] || "bg-gray-500"}`} />
                                                    <span className="text-sm">{status}: {count}</span>
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
                            <CardTitle>Phân bổ ưu tiên</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tasksLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(priorityBreakdown).map(([priority, count]) => (
                                        <div key={priority} className="flex items-center justify-between">
                                            <span className="text-sm">{priority}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 bg-blue-500 rounded" style={{ width: `${(count / Math.max(...Object.values(priorityBreakdown), 1)) * 200}px` }} />
                                                <span className="text-sm font-medium w-8 text-right">{count}</span>
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
                            <CardTitle>Loại công việc</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tasksLoading ? (
                                <Skeleton className="h-32 w-full" />
                            ) : (
                                <div className="space-y-3">
                                    {workTypesBreakdown.map(({ type, count, percentage }) => (
                                        <div key={type}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium">{type}</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {percentage}% • {count}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all"
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
                            <CardTitle>Biểu đồ thời gian</CardTitle>
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

