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

export default function ProjectOverviewPage() {
    const { projectId } = useParams();
    const { projectData, loading: projectLoading } = useOutletContext();
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setTasksLoading(true);
                const data = await taskService.getTasksByProject(projectId);
                setTasks(Array.isArray(data) ? data : []);
            } catch (_e) {
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
        const completed = tasks.filter(t => 
            t.status?.toUpperCase().includes("COMPLETED") || 
            t.status?.toUpperCase().includes("HOÀN THÀNH")
        ).length;
        const inProgress = tasks.filter(t => 
            t.status?.toUpperCase().includes("IN PROGRESS") || 
            t.status?.toUpperCase().includes("ĐANG LÀM")
        ).length;
        const todo = tasks.filter(t => 
            t.status?.toUpperCase().includes("TODO") || 
            t.status?.toUpperCase().includes("CHỜ")
        ).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, inProgress, todo, progress };
    }, [tasks]);

    // Status breakdown for donut chart
    const statusBreakdown = useMemo(() => {
        const breakdown = {
            "To Do": 0,
            "In Progress": 0,
            "In Review": 0,
            "Done": 0,
        };

        tasks.forEach(task => {
            const status = (task.status || "").toUpperCase();
            if (status.includes("COMPLETED") || status.includes("HOÀN THÀNH") || status.includes("DONE")) {
                breakdown["Done"]++;
            } else if (status.includes("IN PROGRESS") || status.includes("ĐANG LÀM")) {
                breakdown["In Progress"]++;
            } else if (status.includes("REVIEW") || status.includes("KIỂM TRA")) {
                breakdown["In Review"]++;
            } else {
                breakdown["To Do"]++;
            }
        });

        return breakdown;
    }, [tasks]);

    // Priority breakdown
    const priorityBreakdown = useMemo(() => {
        const breakdown = {
            "Highest": 0,
            "High": 0,
            "Medium": 0,
            "Low": 0,
            "Lowest": 0,
            "None": 0,
        };

        tasks.forEach(task => {
            const priority = (task.priority || "").toUpperCase();
            if (priority.includes("CRITICAL") || priority.includes("CAO NHẤT")) {
                breakdown["Highest"]++;
            } else if (priority.includes("HIGH") || priority.includes("CAO")) {
                breakdown["High"]++;
            } else if (priority.includes("MEDIUM") || priority.includes("TRUNG BÌNH")) {
                breakdown["Medium"]++;
            } else if (priority.includes("LOW") || priority.includes("THẤP")) {
                breakdown["Low"]++;
            } else if (priority.includes("LOWEST") || priority.includes("THẤP NHẤT")) {
                breakdown["Lowest"]++;
            } else {
                breakdown["None"]++;
            }
        });

        return breakdown;
    }, [tasks]);

    // Work types breakdown
    const workTypesBreakdown = useMemo(() => {
        const breakdown = {
            "Epic": 0,
            "Task": 0,
            "Bug": 0,
            "Subtask": 0,
        };

        tasks.forEach(task => {
            const type = (task.taskType || "").toUpperCase();
            if (type.includes("EPIC")) {
                breakdown["Epic"]++;
            } else if (type.includes("BUG")) {
                breakdown["Bug"]++;
            } else if (type.includes("SUBTASK") || type.includes("SUB")) {
                breakdown["Subtask"]++;
            } else {
                breakdown["Task"]++;
            }
        });

        const total = tasks.length;
        return Object.entries(breakdown).map(([type, count]) => ({
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
                            change={`trong ${stats.total} nhiệm vụ`}
                        />
                        <StatsCard
                            title="Đã cập nhật"
                            value={stats.inProgress}
                            change="đang thực hiện"
                        />
                        <StatsCard
                            title="Đã tạo"
                            value={stats.total}
                            change="tổng số nhiệm vụ"
                        />
                        <StatsCard
                            title="Sắp đến hạn"
                            value={0}
                            change="trong 7 ngày tới"
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
                                <span className="text-sm text-gray-600 dark:text-gray-400">{stats.progress}%</span>
                            </div>
                            <Progress value={stats.progress} />
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
                                                        "To Do": "#3b82f6",
                                                        "In Progress": "#8b5cf6",
                                                        "In Review": "#06b6d4",
                                                        "Done": "#10b981",
                                                    };
                                                    
                                                    return (
                                                        <circle
                                                            key={status}
                                                            cx="96"
                                                            cy="96"
                                                            r="80"
                                                            fill="none"
                                                            stroke={colors[status] || "#gray"}
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
                                                "To Do": "bg-blue-500",
                                                "In Progress": "bg-purple-500",
                                                "In Review": "bg-cyan-500",
                                                "Done": "bg-green-500",
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
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
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

