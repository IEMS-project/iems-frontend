import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import KanbanColumn from "../components/tasks/KanbanColumn";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";
import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";

const initialTasks = { "Chờ": [], "Đang làm": [], "Hoàn thành": [] };

export default function Tasks() {
    const [tasks, setTasks] = useState(initialTasks);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedTasks, setSavedTasks] = useState(initialTasks);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [filters, setFilters] = useState({
        projectId: [],
        status: [],
        priority: [],
        dateFrom: "",
        dateTo: "",
    });
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const projectDropdownRef = useRef(null);
    const statusDropdownRef = useRef(null);
    const priorityDropdownRef = useRef(null);
    const skeletonColumns = useMemo(() => ["Chờ", "Đang làm", "Hoàn thành"], []);
    const skeletonCards = useMemo(() => Array.from({ length: 3 }), []);

    const statusOptions = ["Chờ", "Đang làm", "Hoàn thành"];
    const priorityOptions = ["Cao", "Trung bình", "Thấp"];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
                setShowProjectDropdown(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setShowStatusDropdown(false);
            }
            if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
                setShowPriorityDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleDragStart = (e, task, status) => {
        // Nếu task đang nằm trong nhóm đã chọn, kéo cả nhóm; ngược lại kéo một task
        const isMulti = selectedIds.has(task.id) && selectedIds.size > 1;
        if (isMulti) {
            setDraggedTask({ ids: Array.from(selectedIds), sourceStatus: status });
        } else {
            setDraggedTask({ id: task.id, sourceStatus: status });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        if (!draggedTask || draggedTask.sourceStatus === targetStatus) return;

        const mapStatusToEnum = (s) => {
            if (s === "Chờ") return "TO_DO";
            if (s === "Đang làm") return "IN_PROGRESS";
            if (s === "Hoàn thành") return "COMPLETED";
            return undefined;
        };
        const backendStatus = mapStatusToEnum(targetStatus);
        if (!backendStatus) return;

        const newTasks = { ...tasks };

        try {
            if (draggedTask.ids && Array.isArray(draggedTask.ids)) {
                // Queue locally only; save button will persist

                // Remove from source columns and add to target
                const idSet = new Set(draggedTask.ids);
                Object.keys(newTasks).forEach(col => {
                    newTasks[col] = newTasks[col].filter(t => !idSet.has(t.id));
                });
                const moved = [];
                idSet.forEach(id => {
                    const original = findTaskById(tasks, id);
                    if (original) moved.push({ ...original, status: targetStatus });
                });
                newTasks[targetStatus] = [...newTasks[targetStatus], ...moved];

                // Clear selection after move
                setSelectedIds(new Set());
            } else if (draggedTask.id) {
                // Remove from source
                newTasks[draggedTask.sourceStatus] = newTasks[draggedTask.sourceStatus].filter(
                    t => t.id !== draggedTask.id
                );
                // Add to target with original object
                const original = findTaskById(tasks, draggedTask.id);
                newTasks[targetStatus] = [...newTasks[targetStatus], { ...(original || {}), id: draggedTask.id, status: targetStatus }];
            }

            setTasks(newTasks);
            setHasUnsavedChanges(true);
        } finally {
            setDraggedTask(null);
        }
    };

    const handleTaskClick = (task) => {
        // Toggle multi-select; click lần nữa để bỏ chọn
        const next = new Set(selectedIds);
        if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
        setSelectedIds(next);

        // Mở chi tiết khi chỉ chọn một
        if (next.size === 1 && next.has(task.id)) {
            setSelectedTask(task);
            setShowDetailModal(true);
        }
    };

    const findTaskById = (data, id) => {
        for (const status of Object.keys(data)) {
            const f = data[status].find(t => t.id === id);
            if (f) return f;
        }
        return null;
    };

    // Load projects for filter
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const list = await projectService.getMyProjects();
                setProjects(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error('Error loading projects:', e);
            }
        };
        loadProjects();
    }, []);

    // Load tasks from backend: my-tasks across all projects
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const list = await taskService.getMyTasks();
                // list is TaskResponseDto (flat); group into Kanban columns by status display name
                let filtered = Array.isArray(list) ? list : [];
                
                // Apply filters
                if (filters.projectId && filters.projectId.length > 0) {
                    filtered = filtered.filter(t => filters.projectId.includes(t.projectId));
                }
                if (filters.status && filters.status.length > 0) {
                    filtered = filtered.filter(t => {
                        const taskStatus = (t.status || '').toLowerCase();
                        return filters.status.some(selectedStatus => {
                            const statusLower = selectedStatus.toLowerCase();
                            if (statusLower === 'chờ') {
                                return taskStatus.includes('to do') || taskStatus.includes('chờ');
                            } else if (statusLower === 'đang làm') {
                                return taskStatus.includes('progress') || taskStatus.includes('làm');
                            } else if (statusLower === 'hoàn thành') {
                                return taskStatus.includes('completed') || taskStatus.includes('hoàn thành');
                            }
                            return false;
                        });
                    });
                }
                if (filters.priority && filters.priority.length > 0) {
                    filtered = filtered.filter(t => {
                        const taskPriority = (t.priority || '').toString().toLowerCase();
                        return filters.priority.some(selectedPriority => {
                            const priorityLower = selectedPriority.toLowerCase();
                            if (priorityLower === 'cao') {
                                return taskPriority.includes('high') || taskPriority.includes('cao');
                            } else if (priorityLower === 'trung bình') {
                                return taskPriority.includes('medium') || taskPriority.includes('trung bình') || taskPriority.includes('trung bin');
                            } else if (priorityLower === 'thấp') {
                                return taskPriority.includes('low') || taskPriority.includes('thấp') || taskPriority.includes('thap');
                            }
                            return false;
                        });
                    });
                }
                // Filter by date range (dueDate)
                if (filters.dateFrom || filters.dateTo) {
                    filtered = filtered.filter(t => {
                        if (!t.dueDate) return false;
                        const taskDate = new Date(t.dueDate);
                        if (filters.dateFrom) {
                            const fromDate = new Date(filters.dateFrom);
                            fromDate.setHours(0, 0, 0, 0);
                            if (taskDate < fromDate) return false;
                        }
                        if (filters.dateTo) {
                            const toDate = new Date(filters.dateTo);
                            toDate.setHours(23, 59, 59, 999);
                            if (taskDate > toDate) return false;
                        }
                        return true;
                    });
                }
                
                const group = { "Chờ": [], "Đang làm": [], "Hoàn thành": [] };
                for (const t of filtered) {
                    const status = (t.status || '').toLowerCase();
                    const uiStatus = status.includes('to do') || status.includes('chờ') ? 'Chờ'
                        : status.includes('progress') || status.includes('làm') ? 'Đang làm'
                            : 'Hoàn thành';
                    group[uiStatus].push({
                        id: t.id,
                        title: t.title,
                        project: t.projectName || t.projectId,
                        dueDate: t.dueDate,
                        description: t.description,
                        priority: t.priority,
                    });
                }
                setTasks(group);
                setSavedTasks(group);
            } catch (e) {
                console.error('Error loading my tasks:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [filters]);

    // Save tasks: no-op (state reflects backend already via bulk update)
    const handleSave = async () => {
        setIsSaving(true);
        try {
        // Persist all moves since last save: compare savedTasks vs tasks
        const toUpdate = [];
        Object.entries(tasks).forEach(([status, list]) => {
            list.forEach(t => {
                const prev = findTaskById(savedTasks, t.id);
                if (prev && prev.status !== status) {
                    // map UI status to enum
                    const map = s => s === 'Chờ' ? 'TO_DO' : s === 'Đang làm' ? 'IN_PROGRESS' : 'COMPLETED';
                    toUpdate.push({ id: t.id, newStatus: map(status) });
                }
            });
        });

        if (toUpdate.length > 0) {
            const idsByStatus = toUpdate.reduce((acc, cur) => {
                acc[cur.newStatus] = acc[cur.newStatus] || [];
                acc[cur.newStatus].push(cur.id);
                return acc;
            }, {});
            // Call bulk API per status group
            for (const [newStatus, ids] of Object.entries(idsByStatus)) {
                await taskService.bulkUpdateStatus(ids, newStatus);
            }
        }

        setSavedTasks(tasks);
        setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving tasks:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Reset to last saved state
    const handleReset = () => {
        setTasks(savedTasks);
        setHasUnsavedChanges(false);
        setSelectedIds(new Set());
    };


    return (
        <>
            <div className="space-y-6">
                <PageHeader breadcrumbs={[{ label: "Nhiệm vụ", to: "/tasks" }]} />

                {/* Filters and Save Controls - Same Row */}
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    {/* Filters - Left Side */}
                    <div className="flex items-end gap-4 flex-1 flex-wrap">
                        {/* Multi-select Project Filter */}
                        <div className="relative" ref={projectDropdownRef}>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                                Dự án
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400"
                            >
                                {filters.projectId.length === 0
                                    ? "Tất cả dự án"
                                    : filters.projectId.length === 1
                                    ? projects.find(p => p.id === filters.projectId[0])?.name || "Dự án"
                                    : `${filters.projectId.length} dự án`}
                                <svg className="float-right mt-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showProjectDropdown && (
                                <div className="absolute z-10 mt-1 w-48 max-h-60 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <div className="p-2 space-y-1">
                                        {projects.length === 0 ? (
                                            <div className="p-2 text-sm text-gray-500 dark:text-gray-400">Không có dự án</div>
                                        ) : (
                                            projects.map((project) => (
                                                <Checkbox
                                                    key={project.id}
                                                    label={project.name}
                                                    checked={filters.projectId.includes(project.id)}
                                                    onChange={(e) => {
                                                        const newProjectIds = e.target.checked
                                                            ? [...filters.projectId, project.id]
                                                            : filters.projectId.filter(id => id !== project.id);
                                                        setFilters({ ...filters, projectId: newProjectIds });
                                                    }}
                                                    className="w-full"
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Multi-select Status Filter */}
                        <div className="relative" ref={statusDropdownRef}>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                                Trạng thái
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400"
                            >
                                {filters.status.length === 0
                                    ? "Tất cả trạng thái"
                                    : filters.status.length === 1
                                    ? filters.status[0]
                                    : `${filters.status.length} trạng thái`}
                                <svg className="float-right mt-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute z-10 mt-1 w-48 rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <div className="p-2 space-y-1">
                                        {statusOptions.map((option) => (
                                            <Checkbox
                                                key={option}
                                                label={option}
                                                checked={filters.status.includes(option)}
                                                onChange={(e) => {
                                                    const newStatus = e.target.checked
                                                        ? [...filters.status, option]
                                                        : filters.status.filter(s => s !== option);
                                                    setFilters({ ...filters, status: newStatus });
                                                }}
                                                className="w-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Multi-select Priority Filter */}
                        <div className="relative" ref={priorityDropdownRef}>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                                Độ ưu tiên
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400"
                            >
                                {filters.priority.length === 0
                                    ? "Tất cả độ ưu tiên"
                                    : filters.priority.length === 1
                                    ? filters.priority[0]
                                    : `${filters.priority.length} độ ưu tiên`}
                                <svg className="float-right mt-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showPriorityDropdown && (
                                <div className="absolute z-10 mt-1 w-48 rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <div className="p-2 space-y-1">
                                        {priorityOptions.map((option) => (
                                            <Checkbox
                                                key={option}
                                                label={option}
                                                checked={filters.priority.includes(option)}
                                                onChange={(e) => {
                                                    const newPriority = e.target.checked
                                                        ? [...filters.priority, option]
                                                        : filters.priority.filter(p => p !== option);
                                                    setFilters({ ...filters, priority: newPriority });
                                                }}
                                                className="w-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Input
                            label="Từ ngày"
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="w-40"
                        />
                        <Input
                            label="Đến ngày"
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="w-40"
                        />
                    </div>

                    {/* Save/Reset Controls - Right Side */}
                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Có thay đổi chưa lưu
                            </span>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleReset}
                                disabled={!hasUnsavedChanges || isSaving}
                            >
                                Khôi phục
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                disabled={!hasUnsavedChanges || isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        Lưu thay đổi
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {loading ? (

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {skeletonColumns.map((status) => (
                                <Card key={status}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-base">
                                            <span>{status}</span>
                                            <Skeleton className="h-5 w-12 rounded-full" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="min-h-[350px] space-y-3 mt-1">
                                            {skeletonCards.map((_, idx) => (
                                                <div key={idx} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-3 w-1/2" />
                                                    <Skeleton className="h-3 w-1/3" />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {Object.entries(tasks).map(([status, statusTasks]) => (
                                <KanbanColumn
                                    key={status}
                                    status={status}
                                    tasks={statusTasks}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onDragStart={handleDragStart}
                                    onTaskClick={handleTaskClick}
                                    selectedIds={selectedIds}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
            < TaskDetailModal
                open={showDetailModal}
                onClose={() => setShowDetailModal(false)
                }
                task={selectedTask}
            />
        </>
    );
}
