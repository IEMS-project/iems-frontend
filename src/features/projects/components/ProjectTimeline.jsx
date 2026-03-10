import React, { useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/select";
import TaskDetailModal from "@/features/tasks/components/TaskDetailModal";
import Skeleton from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import {
    GanttProvider,
    GanttSidebar,
    GanttSidebarGroup,
    GanttSidebarItem,
    GanttTimeline,
    GanttHeader,
    GanttFeatureList,
    GanttFeatureListGroup,
    GanttFeatureItem,
    GanttToday,
} from "@/components/ui/shadcn-io/gantt";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { EyeIcon, TrashIcon } from "lucide-react";
import { differenceInDays, differenceInMonths, startOfDay, startOfMonth, getDaysInMonth, getDate } from "date-fns";
import { translateStatus } from "@/lib/i18n";
import { getTaskTypeIcon, getTaskTypeColor } from "@/features/tasks/utils/taskTypeUtils";

// Simple groupBy utility
const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = String(key(item));
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

export default function ProjectTimeline({ tasks = [], loading = false }) {
    const { t } = useTranslation();
    const [range, setRange] = useState("monthly"); // "daily" | "monthly" | "quarterly"
    const [zoom] = useState(100);
    const [selectedTask, setSelectedTask] = useState(null);
    const ganttContainerRef = useRef(null);
    const [filters, setFilters] = useState({
        assignee: "",
        status: "",
        tag: "",
    });

    // Get unique values for filters
    const assignees = useMemo(() => {
        return [...new Set(tasks.map(t =>
            t.assignedToName ||
            t.assigneeName ||
            t.userName ||
            (t.assignedTo && typeof t.assignedTo === 'object' ? t.assignedTo.name || t.assignedTo.fullName : null) ||
            t.assignedToEmail ||
            t.assigneeEmail ||
            ""
        ).filter(Boolean))];
    }, [tasks]);

    const statuses = useMemo(() => {
        return [...new Set(tasks.map(t => translateStatus(t.status)).filter(Boolean))];
    }, [tasks]);

    const tags = useMemo(() => {
        return [...new Set(tasks.flatMap(t => t.tags || []).filter(Boolean))];
    }, [tasks]);

    // Filter tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (filters.assignee) {
                const assignedName =
                    task.assignedToName ||
                    task.assigneeName ||
                    task.userName ||
                    (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.name || task.assignedTo.fullName : null) ||
                    task.assignedToEmail ||
                    task.assigneeEmail ||
                    "";
                if (assignedName !== filters.assignee && task.assignedToEmail !== filters.assignee && task.assigneeEmail !== filters.assignee) {
                    return false;
                }
            }
            if (filters.status && translateStatus(task.status) !== filters.status) {
                return false;
            }
            if (filters.tag && (!task.tags || !task.tags.includes(filters.tag))) {
                return false;
            }
            return true;
        });
    }, [tasks, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ assignee: "", status: "", tag: "" });
    };

    const hasActiveFilters = filters.assignee || filters.status || filters.tag;

    // Function to scroll to today and center it
    const scrollToToday = useCallback(() => {
        const ganttElement = ganttContainerRef.current?.querySelector('.gantt');
        if (!ganttElement) return;

        // Wait a bit for DOM to be ready
        setTimeout(() => {
            const today = new Date();
            const timelineStartDate = new Date(today.getFullYear() - 1, 0, 1);

            // Calculate column width based on range and zoom (same as GanttProvider)
            let columnWidth = 150;
            if (range === "daily") {
                columnWidth = 50;
            } else if (range === "quarterly") {
                columnWidth = 100;
            }
            const parsedColumnWidth = (columnWidth * zoom) / 100;

            // Calculate offset using same logic as GanttToday component
            let fullColumns = 0;
            let innerOffset = 0;

            if (range === "daily") {
                fullColumns = differenceInDays(startOfDay(today), startOfDay(timelineStartDate));
                // For daily, no inner offset needed
                innerOffset = 0;
            } else {
                // monthly or quarterly
                fullColumns = differenceInMonths(startOfMonth(today), startOfMonth(timelineStartDate));
                // Calculate inner offset within the month
                const totalDaysInMonth = getDaysInMonth(today);
                const dayOfMonth = getDate(today);

                // Similar to calculateInnerOffset in gantt component
                const totalRangeDays = range === "monthly" ? totalDaysInMonth : totalDaysInMonth;
                innerOffset = (dayOfMonth / totalRangeDays) * parsedColumnWidth;
            }

            // Total position of today marker
            const totalOffset = fullColumns * parsedColumnWidth + innerOffset;
            const sidebarWidth = 300;
            const visibleWidth = ganttElement.clientWidth - sidebarWidth;

            // Center today marker in viewport: scroll so that today is at the center
            const targetScrollLeft = Math.max(0, totalOffset - visibleWidth / 2);

            ganttElement.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth',
            });
        }, 100);
    }, [range, zoom]);

    // Define status colors based on Vietnamese status names
    const statusColors = useMemo(() => {
        const statusMap = new Map();

        tasks.forEach(task => {
            const statusLabel = translateStatus(task.status) || "Chưa xác định";
            if (!statusMap.has(statusLabel)) {
                let color = "#6B7280"; // default gray

                // Map Vietnamese status names to colors
                if (statusLabel === "Hoàn thành") {
                    color = "#10B981"; // green
                } else if (statusLabel === "Đang thực hiện") {
                    color = "#3B82F6"; // blue
                } else if (statusLabel === "Đang chờ") {
                    color = "#F59E0B"; // yellow/orange
                } else if (statusLabel === "Đang duyệt") {
                    color = "#8B5CF6"; // purple
                } else if (statusLabel === "Bị chặn") {
                    color = "#F97316";
                } else if (statusLabel === "Đã hủy") {
                    color = "#6B7280";
                }

                statusMap.set(statusLabel, {
                    id: statusLabel,
                    name: statusLabel,
                    color: color,
                });
            }
        });

        return Array.from(statusMap.values());
    }, [tasks]);

    // Convert filtered tasks to GanttFeature format
    const features = useMemo(() => {
        return filteredTasks.map((task) => {
            const taskId = task.id || task.taskId || `task-${Math.random()}`;
            const taskName = task.name || task.title || "Nhiệm vụ chưa đặt tên";

            // Get dates - default to today if not provided
            const startDate = task.startDate
                ? new Date(task.startDate)
                : task.dueDate
                    ? new Date(task.dueDate)
                    : new Date();

            const endDate = task.endDate
                ? new Date(task.endDate)
                : task.dueDate
                    ? new Date(task.dueDate)
                    : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // default 7 days

            // Get status
            const taskStatus = translateStatus(task.status) || "Chưa xác định";
            const status = statusColors.find(s => s.name === taskStatus) || statusColors[0] || {
                id: taskStatus,
                name: taskStatus,
                color: "#6B7280"
            };

            return {
                id: taskId,
                name: taskName,
                startAt: startDate,
                endAt: endDate,
                status: status,
            };
        });
    }, [filteredTasks, statusColors]);

    // Group features by status
    const groupedFeatures = useMemo(() => {
        const grouped = groupBy(features, (feature) => feature.status.name);
        return Object.fromEntries(
            Object.entries(grouped).sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        );
    }, [features]);

    const handleViewTask = (taskId) => {
        const task = filteredTasks.find(t => (t.id || t.taskId) === taskId);
        if (task) {
            setSelectedTask(task);
        }
    };

    const handleMoveTask = (taskId, startAt, endAt) => {
        if (!endAt) return;
        // TODO: Implement task move/update API call
        console.log(`Move task ${taskId} from ${startAt} to ${endAt}`);
    };

    const closeModal = () => setSelectedTask(null);

    // Get assigned user info for display
    const getAssignedUser = (task) => {
        const assignedName =
            task.assignedToName ||
            task.assigneeName ||
            task.userName ||
            (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.name || task.assignedTo.fullName : null) ||
            "";
        const assignedEmail =
            task.assignedToEmail ||
            task.assigneeEmail ||
            (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.email : null) ||
            "";
        const assignedImage =
            task.assignedTo?.avatar ||
            task.assignedTo?.image ||
            null;

        return { name: assignedName, email: assignedEmail, image: assignedImage };
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle>{t('projects.detail.timeline.title')}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select
                            value={filters.assignee}
                            onChange={(e) => handleFilterChange("assignee", e.target.value)}
                            className="w-auto min-w-[150px]"
                        >
                            <option value="">{t('projects.detail.timeline.filters.assignee')}</option>
                            {assignees.map(assignee => (
                                <option key={assignee} value={assignee}>{assignee}</option>
                            ))}
                        </Select>
                        <Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="w-auto min-w-[130px]"
                        >
                            <option value="">{t('projects.detail.timeline.filters.status')}</option>
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </Select>
                        <Select
                            value={filters.tag}
                            onChange={(e) => handleFilterChange("tag", e.target.value)}
                            className="w-auto min-w-[120px]"
                        >
                            <option value="">{t('projects.detail.timeline.filters.tag')}</option>
                            {tags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </Select>
                        {hasActiveFilters && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={clearFilters}
                            >
                                {t('projects.detail.timeline.actions.clearFilters')}
                            </Button>
                        )}
                        <div className="ml-2 flex items-center gap-2 border-l pl-2">
                            <Button
                                variant={range === "daily" ? "primary" : "secondary"}
                                onClick={() => setRange("daily")}
                            >
                                {t('projects.detail.timeline.range.daily')}
                            </Button>
                            <Button
                                variant={range === "monthly" ? "primary" : "secondary"}
                                onClick={() => setRange("monthly")}
                            >
                                {t('projects.detail.timeline.range.monthly')}
                            </Button>
                            <Button
                                variant={range === "quarterly" ? "primary" : "secondary"}
                                onClick={() => setRange("quarterly")}
                            >
                                {t('projects.detail.timeline.range.quarterly')}
                            </Button>
                            <Button variant="secondary" onClick={scrollToToday}>{t('projects.detail.timeline.actions.scrollToToday')}</Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="space-y-4 p-6">
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="grid" style={{ gridTemplateColumns: `240px 1fr` }}>
                                    <div className="sticky left-0 bg-background border-b py-3 px-3">
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                    <div className="relative border-b py-3">
                                        <Skeleton className="h-8 w-1/2 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : features.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground p-6">
                        {t('projects.detail.timeline.noTasks')}
                    </div>
                ) : (
                    <div className="h-[calc(100vh-280px)] max-h-[800px] min-h-[475px] w-full overflow-hidden" ref={ganttContainerRef}>
                        <GanttProvider
                            className="border rounded-md h-full"
                            range={range}
                            zoom={zoom}
                        >
                            <GanttSidebar>
                                {Object.entries(groupedFeatures).map(([statusName, statusFeatures]) => (
                                    <GanttSidebarGroup key={statusName} name={statusName}>
                                        {statusFeatures.map((feature) => (
                                            <GanttSidebarItem
                                                key={feature.id}
                                                feature={feature}
                                                onSelectItem={undefined}
                                            />
                                        ))}
                                    </GanttSidebarGroup>
                                ))}
                            </GanttSidebar>

                            <GanttTimeline>
                                <GanttHeader />
                                <GanttFeatureList>
                                    {Object.entries(groupedFeatures).map(([statusName, statusFeatures]) => (
                                        <GanttFeatureListGroup key={statusName}>
                                            {statusFeatures.map((feature) => {
                                                const task = filteredTasks.find(t => (t.id || t.taskId) === feature.id);
                                                const assignedUser = task ? getAssignedUser(task) : null;

                                                return (
                                                    <div className="flex" key={feature.id}>
                                                        <ContextMenu>
                                                            <ContextMenuTrigger asChild>
                                                                <button
                                                                    onClick={() => handleViewTask(feature.id)}
                                                                    type="button"
                                                                    className="w-full"
                                                                >
                                                                    <GanttFeatureItem
                                                                        onMove={handleMoveTask}
                                                                        {...feature}
                                                                    >
                                                                        <p className="flex-1 truncate text-xs">
                                                                            {feature.name}
                                                                        </p>
                                                                        {assignedUser && assignedUser.name && (
                                                                            <Avatar src={assignedUser.image} name={assignedUser.name} className="h-4 w-4 shrink-0 text-[8px]" />
                                                                        )}
                                                                    </GanttFeatureItem>
                                                                </button>
                                                            </ContextMenuTrigger>
                                                            <ContextMenuContent>
                                                                <ContextMenuItem
                                                                    className="flex items-center gap-2"
                                                                    onClick={() => handleViewTask(feature.id)}
                                                                >
                                                                    <EyeIcon className="text-muted-foreground" size={16} />
                                                                    {t('projects.actions.view')}
                                                                </ContextMenuItem>
                                                            </ContextMenuContent>
                                                        </ContextMenu>
                                                    </div>
                                                );
                                            })}
                                        </GanttFeatureListGroup>
                                    ))}
                                </GanttFeatureList>
                                <GanttToday />
                            </GanttTimeline>
                        </GanttProvider>
                    </div>
                )}
            </CardContent>

            <TaskDetailModal open={!!selectedTask} onClose={closeModal} task={selectedTask} />
        </Card>
    );
}


