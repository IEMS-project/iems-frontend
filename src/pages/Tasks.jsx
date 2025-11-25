import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import Select from "../components/ui/select";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";
import { taskService } from "../services/taskService";
import { projectService } from "../services/projectService";
import {
    KanbanProvider,
    KanbanBoard,
    KanbanHeader,
    KanbanCards,
    KanbanCard,
} from "../components/ui/shadcn-io/kanban";
import Badge from "../components/ui/Badge";
import { getTaskTypeIcon, getTaskTypeColor } from "../lib/taskTypeUtils";
import { ChevronUp, ChevronDown, Equal } from 'lucide-react';

const initialTasks = { "Đang chờ": [], "Đang thực hiện": [], "Hoàn thành": [] };

export default function Tasks() {
    const [tasks, setTasks] = useState(initialTasks);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
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
    const skeletonColumns = useMemo(() => ["Đang chờ", "Đang thực hiện", "Hoàn thành"], []);
    const skeletonCards = useMemo(() => Array.from({ length: 3 }), []);

    const statusOptions = ["Đang chờ", "Đang thực hiện", "Hoàn thành"];
    const priorityOptions = ["Cao", "Trung bình", "Thấp"];

    // Transform tasks object to kanban format
    const kanbanColumns = useMemo(() =>
        statusOptions.map(status => ({ id: status, name: status })),
        []
    );

    const kanbanData = useMemo(() => {
        const data = [];
        Object.entries(tasks).forEach(([status, statusTasks]) => {
            statusTasks.forEach(task => {
                data.push({
                    id: task.id,
                    name: task.title,
                    column: status,
                    ...task, // Include all task properties
                });
            });
        });
        return data;
    }, [tasks]);

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


    // Handle kanban data change (drag and drop)
    const handleKanbanDataChange = (newData) => {
        // Transform kanban data back to tasks object
        const newTasks = { "Đang chờ": [], "Đang thực hiện": [], "Hoàn thành": [] };
        newData.forEach(item => {
            const task = {
                id: item.id,
                title: item.name || item.title,
                project: item.project,
                startDate: item.startDate,
                dueDate: item.dueDate,
                description: item.description,
                priority: item.priority,
                type: item.type || item.taskType,
            };
            if (newTasks[item.column]) {
                newTasks[item.column].push(task);
            }
        });
        setTasks(newTasks);
        setHasUnsavedChanges(true);
    };

    const handleTaskClick = (task) => {
        // Open detail modal when clicking a task
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    // Helper functions for task card rendering
    const getTimeRemaining = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

        if (diffTime < 0) {
            return `Quá hạn ${Math.abs(diffDays)}d`;
        } else if (diffDays === 0 && diffHours === 0) {
            return `Còn ${diffMinutes}m`;
        } else if (diffDays === 0) {
            return `Còn ${diffHours}h`;
        } else {
            return `Còn ${diffDays}d`;
        }
    };

    const getPriorityVariant = (priority) => {
        if (!priority) return "gray";
        const priorityUpper = priority.toString().toUpperCase();
        if (["CAO", "HIGH"].includes(priorityUpper)) return "red";
        if (["TRUNG BÌNH", "TRUNG BINH", "MEDIUM"].includes(priorityUpper)) return "yellow";
        if (["THẤP", "THAP", "LOW"].includes(priorityUpper)) return "green";
        return "gray";
    };

    const formatPriority = (priority) => {
        if (!priority) return "N/A";
        const priorityUpper = priority.toString().toUpperCase();
        if (["HIGH", "CAO"].includes(priorityUpper)) return "Cao";
        if (["MEDIUM", "TRUNG BÌNH", "TRUNG BINH"].includes(priorityUpper)) return "Trung bình";
        if (["LOW", "THẤP", "THAP"].includes(priorityUpper)) return "Thấp";
        return priority;
    };

    // Jira-style date badge component: calendar icon for normal dates,
    // warning triangle + red styling only when overdue.
    const JiraDateBadge = ({ date, overdue }) => {
        if (!date) return null;
        let formatted = "";
        try {
            const d = new Date(date);
            formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            formatted = date;
        }

        const baseClass = 'inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium select-none';
        const normalClass = `${baseClass} border border-gray-300 bg-white text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100`;
        const overdueClass = `${baseClass} border border-red-400 bg-red-50 text-red-600`;

        return (
            <span className={overdue ? overdueClass : normalClass}>
                {overdue ? (
                    <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 9v4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 17h.01" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.5} />
                        <path d="M16 2v4M8 2v4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                <span>{formatted}</span>
            </span>
        );
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
                // Debug: Check if tasks have type field
                console.log('Tasks from backend:', list);
                if (list && list.length > 0) {
                    console.log('First task fields:', Object.keys(list[0]));
                    console.log('First task type:', list[0].type || list[0].taskType);
                }
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
                            if (statusLower === 'Đang chờ') {
                                return taskStatus.includes('to do') || taskStatus.includes('Đang chờ');
                            } else if (statusLower === 'Đang thực hiện') {
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

                const group = { "Đang chờ": [], "Đang thực hiện": [], "Hoàn thành": [] };
                for (const t of filtered) {
                    const status = (t.status || '').toLowerCase();
                    const uiStatus = status.includes('to do') || status.includes('Đang chờ') ? 'Đang chờ'
                        : status.includes('progress') || status.includes('làm') ? 'Đang thực hiện'
                            : 'Hoàn thành';
                    group[uiStatus].push({
                        id: t.id,
                        title: t.title,
                        project: t.projectName || t.projectId,
                        startDate: t.startDate,
                        dueDate: t.dueDate,
                        description: t.description,
                        priority: t.priority,
                        type: t.taskType || t.type || 'TASK',
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
                        const map = s => s === 'Đang chờ' ? 'TO_DO' : s === 'Đang thực hiện' ? 'IN_PROGRESS' : 'COMPLETED';
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
                        <div className="flex flex-col items-end">
                            {hasUnsavedChanges && (
                                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Có thay đổi chưa lưu
                                </span>
                            )}

                            <div className="flex gap-2 mt-1">
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
                        <KanbanProvider
                            columns={kanbanColumns}
                            data={kanbanData}
                            onDataChange={handleKanbanDataChange}
                        >
                            {(column) => (
                                <KanbanBoard key={column.id} id={column.id} className="min-h-[500px]">
                                    <KanbanHeader className="flex items-center justify-between p-4 border-b">
                                        <span className="font-semibold">{column.name}</span>
                                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full dark:bg-gray-800 dark:text-gray-300">
                                            {kanbanData.filter(item => item.column === column.id).length}
                                        </span>
                                    </KanbanHeader>
                                    <KanbanCards id={column.id} className="min-h-[400px]">
                                        {(item) => {
                                            const timeRemaining = getTimeRemaining(item.dueDate);
                                            const isOverdue = timeRemaining && timeRemaining.includes("Quá hạn");
                                            const isSelected = selectedIds.has(item.id);

                                            return (
                                                <KanbanCard
                                                    key={item.id}
                                                    id={item.id}
                                                    name={item.name}
                                                    column={item.column}
                                                    className={isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950 cursor-pointer" : "cursor-pointer"}
                                                >
                                                    <div
                                                        className="space-y-2"
                                                        onPointerDown={(e) => {
                                                            e.currentTarget.dataset.startX = e.clientX;
                                                            e.currentTarget.dataset.startY = e.clientY;
                                                            e.currentTarget.dataset.isDragging = 'false';
                                                        }}
                                                        onPointerMove={(e) => {
                                                            const startX = parseFloat(e.currentTarget.dataset.startX || 0);
                                                            const startY = parseFloat(e.currentTarget.dataset.startY || 0);
                                                            // If mouse moved more than 5px, consider it a drag
                                                            if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
                                                                e.currentTarget.dataset.isDragging = 'true';
                                                            }
                                                        }}
                                                        onPointerUp={(e) => {
                                                            const isDragging = e.currentTarget.dataset.isDragging === 'true';

                                                            if (e.button === 0 && !isDragging) {
                                                                // Ctrl+Click to toggle selection
                                                                if (e.ctrlKey || e.metaKey) {
                                                                    const next = new Set(selectedIds);
                                                                    if (next.has(item.id)) {
                                                                        next.delete(item.id);
                                                                    } else {
                                                                        next.add(item.id);
                                                                    }
                                                                    setSelectedIds(next);
                                                                } else {
                                                                    // Normal click - open detail modal
                                                                    handleTaskClick(item);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-2 flex-1">
                                                                {React.createElement(getTaskTypeIcon(item.type), {
                                                                    className: `w-4 h-4 flex-shrink-0 mt-0.5 ${getTaskTypeColor(item.type)}`
                                                                })}
                                                                <h4 className="font-medium text-sm leading-tight flex-1 text-gray-900 dark:text-gray-100">
                                                                    {item.title || item.name}
                                                                </h4>
                                                            </div>
                                                            {timeRemaining && (
                                                                <span className={`text-xs flex-shrink-0 ${isOverdue ? "text-red-500" : "text-green-500"}`}>
                                                                    {timeRemaining}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.dueDate && (
                                                            <div className="pt-1">
                                                                <JiraDateBadge date={item.dueDate} overdue={isOverdue} />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between gap-2">
                                                            {item.project && (
                                                                <Badge variant="black" className="text-xs font-normal truncate flex-shrink-0">
                                                                    {item.project}
                                                                </Badge>
                                                            )}
                                                            {item.priority && (
                                                                <div className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm">
                                                                    {formatPriority(item.priority) === 'Cao' && <ChevronUp className="w-4 h-4 text-red-600 dark:text-red-400" />}
                                                                    {formatPriority(item.priority) === 'Trung bình' && <Equal className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                                                                    {formatPriority(item.priority) === 'Thấp' && <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                                                    <span className="text-gray-900 dark:text-gray-100">{formatPriority(item.priority)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </KanbanCard>
                                            );
                                        }}
                                    </KanbanCards>
                                </KanbanBoard>
                            )}
                        </KanbanProvider>
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
            <TaskDetailModal
                open={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                task={selectedTask}
            />
        </>
    );
}
