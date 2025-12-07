import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
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
import { ChevronUp, ChevronDown, Equal, Clock, RefreshCw, CheckCircle2, ChevronsUp, ChevronsDown, Minus, Circle } from 'lucide-react';
import { textColors, bgColors, borderColors, inputColors, statusColors, cn } from '../theme/colors';

// Status constants - independent of language
const STATUS_KEYS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
};

// Priority constants - independent of language
const PRIORITY_KEYS = {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
};

export default function Tasks() {
    const { t } = useTranslation();

    // Helper to create empty tasks object using status keys
    const createEmptyTasks = () => ({
        [STATUS_KEYS.PENDING]: [],
        [STATUS_KEYS.IN_PROGRESS]: [],
        [STATUS_KEYS.COMPLETED]: []
    });

    // Helper to get translated status name
    const getStatusName = useCallback((statusKey) => {
        switch (statusKey) {
            case STATUS_KEYS.PENDING: return t('tasks.statuses.pending');
            case STATUS_KEYS.IN_PROGRESS: return t('tasks.statuses.inProgress');
            case STATUS_KEYS.COMPLETED: return t('tasks.statuses.completed');
            default: return statusKey;
        }
    }, [t]);

    // Helper to get status icon and color
    const getStatusIcon = useCallback((statusKey) => {
        switch (statusKey) {
            case STATUS_KEYS.PENDING:
                return { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400' };
            case STATUS_KEYS.IN_PROGRESS:
                return { icon: RefreshCw, color: 'text-blue-600 dark:text-blue-400' };
            case STATUS_KEYS.COMPLETED:
                return { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' };
            default:
                return { icon: Clock, color: 'text-gray-600 dark:text-gray-400' };
        }
    }, []);

    // Helper to map backend status to status key
    const mapBackendStatusToKey = (backendStatus) => {
        const status = (backendStatus || '').toLowerCase().trim();

        // Check for PENDING/TO_DO statuses
        if (status.includes('to do') || status.includes('to_do') ||
            status.includes('pending') || status === 'pending' ||
            status.includes('đang chờ') || status.includes('dang cho')) {
            return STATUS_KEYS.PENDING;
        }

        // Check for IN_PROGRESS statuses
        if (status.includes('progress') || status.includes('in_progress') ||
            status.includes('làm') || status.includes('lam') ||
            status.includes('đang thực hiện') || status.includes('dang thuc hien')) {
            return STATUS_KEYS.IN_PROGRESS;
        }

        // Check for COMPLETED statuses
        if (status.includes('complete') || status.includes('done') ||
            status.includes('hoàn thành') || status.includes('hoan thanh')) {
            return STATUS_KEYS.COMPLETED;
        }

        // Default to PENDING if status is unclear
        return STATUS_KEYS.PENDING;
    };

    // Helper to get translated priority name
    const getPriorityName = useCallback((priorityKey) => {
        switch (priorityKey) {
            case PRIORITY_KEYS.HIGH: return t('tasks.priorities.high');
            case PRIORITY_KEYS.MEDIUM: return t('tasks.priorities.medium');
            case PRIORITY_KEYS.LOW: return t('tasks.priorities.low');
            default: return priorityKey;
        }
    }, [t]);

    // Helper to map backend priority to priority key
    const mapBackendPriorityToKey = (backendPriority) => {
        const priority = (backendPriority || '').toString().toUpperCase();
        if (priority.includes('HIGH') || priority.includes('CAO')) {
            return PRIORITY_KEYS.HIGH;
        } else if (priority.includes('LOW') || priority.includes('THẤP') || priority.includes('THAP')) {
            return PRIORITY_KEYS.LOW;
        } else {
            return PRIORITY_KEYS.MEDIUM;
        }
    };

    const [tasks, setTasks] = useState(createEmptyTasks);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedTasks, setSavedTasks] = useState(createEmptyTasks);
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
    const skeletonColumns = useMemo(() => [
        { key: STATUS_KEYS.PENDING, name: getStatusName(STATUS_KEYS.PENDING) },
        { key: STATUS_KEYS.IN_PROGRESS, name: getStatusName(STATUS_KEYS.IN_PROGRESS) },
        { key: STATUS_KEYS.COMPLETED, name: getStatusName(STATUS_KEYS.COMPLETED) }
    ], [getStatusName]);
    const skeletonCards = useMemo(() => Array.from({ length: 3 }), []);

    const statusOptions = useMemo(() => [
        { key: STATUS_KEYS.PENDING, name: t('tasks.statuses.pending') },
        { key: STATUS_KEYS.IN_PROGRESS, name: t('tasks.statuses.inProgress') },
        { key: STATUS_KEYS.COMPLETED, name: t('tasks.statuses.completed') }
    ], [t]);
    const priorityOptions = useMemo(() => [
        { key: PRIORITY_KEYS.HIGH, name: t('tasks.priorities.high') },
        { key: PRIORITY_KEYS.MEDIUM, name: t('tasks.priorities.medium') },
        { key: PRIORITY_KEYS.LOW, name: t('tasks.priorities.low') }
    ], [t]);

    // Transform tasks object to kanban format
    const kanbanColumns = useMemo(() =>
        statusOptions.map(status => ({ id: status.key, name: status.name })),
        [statusOptions]
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
        const newTasks = createEmptyTasks();
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
            return t('tasks.timeRemaining.overdue', { days: Math.abs(diffDays), hours: 0, minutes: 0 }).replace(' 0h 0m', 'd');
        } else if (diffDays === 0 && diffHours === 0) {
            return `${diffMinutes}m`;
        } else if (diffDays === 0) {
            return `${diffHours}h`;
        } else {
            return `${diffDays}d`;
        }
    };

    const formatPriority = (priority) => {
        if (!priority) return "N/A";
        const priorityUpper = priority.toString().toUpperCase();
        if (["HIGH", "CAO", "HIGHEST", "CRITICAL", "CAO NHẤT"].includes(priorityUpper)) return t('tasks.priorities.high');
        if (["MEDIUM", "TRUNG BÌNH", "TRUNG BINH", "NORMAL"].includes(priorityUpper)) return t('tasks.priorities.medium');
        if (["LOW", "THẤP", "THAP", "LOWEST", "THẤP NHẤT"].includes(priorityUpper)) return t('tasks.priorities.low');
        return priority;
    };

    const getPriorityIcon = useCallback((priority) => {
        if (!priority) return null;

        const normalized = priority.toString().trim().toUpperCase();

        // Highest/Critical
        if (["CAO NHẤT", "HIGHEST", "CRITICAL"].includes(normalized)) {
            return { icon: ChevronsUp, color: statusColors.dangerText };
        }
        // High
        if (["CAO", "HIGH"].includes(normalized)) {
            return { icon: ChevronUp, color: statusColors.dangerText };
        }
        // Medium
        if (["TRUNG BÌNH", "MEDIUM", "NORMAL"].includes(normalized)) {
            return { icon: Minus, color: statusColors.warningText };
        }
        // Low
        if (["THẤP", "LOW"].includes(normalized)) {
            return { icon: ChevronDown, color: statusColors.infoText };
        }
        // Lowest
        if (["THẤP NHẤT", "LOWEST"].includes(normalized)) {
            return { icon: ChevronsDown, color: statusColors.infoText };
        }
        // None/Default
        return { icon: Circle, color: textColors.muted };
    }, []);

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
        const normalClass = cn(baseClass, borderColors.medium, bgColors.primary, textColors.primary);
        const overdueClass = cn(baseClass, statusColors.dangerBorder, statusColors.dangerBg, statusColors.dangerText);

        return (
            <span className={overdue ? overdueClass : normalClass}>
                {overdue ? (
                    <svg className={cn("w-4 h-4", statusColors.dangerText)} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 9v4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 17h.01" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg className={cn("w-4 h-4", textColors.secondary)} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.5} />
                        <path d="M16 2v4M8 2v4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                <span>{formatted}</span>
            </span>
        );
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
                        const taskStatusKey = mapBackendStatusToKey(t.status);
                        return filters.status.includes(taskStatusKey);
                    });
                }
                if (filters.priority && filters.priority.length > 0) {
                    filtered = filtered.filter(t => {
                        const taskPriorityKey = mapBackendPriorityToKey(t.priority);
                        return filters.priority.includes(taskPriorityKey);
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

                const group = createEmptyTasks();
                for (const t of filtered) {
                    const statusKey = mapBackendStatusToKey(t.status);
                    group[statusKey].push({
                        id: t.id,
                        title: t.title,
                        project: t.projectName || t.projectId,
                        projectName: t.projectName,
                        startDate: t.startDate,
                        dueDate: t.dueDate,
                        description: t.description,
                        priority: t.priority,
                        type: t.taskType || t.type || 'TASK',
                        status: t.status,
                        assignedTo: t.assignedTo,
                        assignedToName: t.assignedToName || t.userName,
                        attachments: t.attachments || [],
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

            // Helper to map status key to backend enum
            const mapStatusKeyToBackend = (statusKey) => {
                switch (statusKey) {
                    case STATUS_KEYS.PENDING: return 'TO_DO';
                    case STATUS_KEYS.IN_PROGRESS: return 'IN_PROGRESS';
                    case STATUS_KEYS.COMPLETED: return 'COMPLETED';
                    default: return 'TO_DO';
                }
            };

            Object.entries(tasks).forEach(([currentColumn, list]) => {
                list.forEach(t => {
                    // Find where this task was in savedTasks
                    let previousColumn = null;
                    for (const [col, taskList] of Object.entries(savedTasks)) {
                        if (taskList.find(task => task.id === t.id)) {
                            previousColumn = col;
                            break;
                        }
                    }

                    // If task moved to a different column, queue for update
                    if (previousColumn && previousColumn !== currentColumn) {
                        toUpdate.push({
                            id: t.id,
                            newStatus: mapStatusKeyToBackend(currentColumn)
                        });
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
                            <label className={cn("block mb-1 text-sm font-medium", textColors.primary)}>
                                {t('tasks.filters.project')}
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                                className={cn("w-48 rounded-md border px-3 py-2 text-left text-sm shadow-sm outline-none transition", inputColors.base, inputColors.focus)}
                            >
                                {filters.projectId.length === 0
                                    ? t('tasks.filters.allProjects')
                                    : filters.projectId.length === 1
                                        ? projects.find(p => p.id === filters.projectId[0])?.name || t('tasks.filters.project')
                                        : t('tasks.filters.projectCount', { count: filters.projectId.length })}
                                <svg className="float-right mt-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showProjectDropdown && (
                                <div className={cn("absolute z-10 mt-1 w-48 max-h-60 overflow-auto rounded-md border shadow-lg", borderColors.medium, bgColors.primary)}>
                                    <div className="p-2 space-y-1">
                                        {projects.length === 0 ? (
                                            <div className={cn("p-2 text-sm", textColors.secondary)}>{t('tasks.filters.noProjects')}</div>
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
                            <label className={cn("block mb-1 text-sm font-medium", textColors.primary)}>
                                {t('tasks.filters.status')}
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className={cn("w-48 rounded-md border px-3 py-2 text-left text-sm shadow-sm outline-none transition", inputColors.base, inputColors.focus)}
                            >
                                {filters.status.length === 0
                                    ? t('tasks.filters.allStatuses')
                                    : filters.status.length === 1
                                        ? getStatusName(filters.status[0])
                                        : t('tasks.filters.statusCount', { count: filters.status.length })}
                                <svg className="float-right mt-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showStatusDropdown && (
                                <div className={cn("absolute z-10 mt-1 w-48 rounded-md border shadow-lg", borderColors.medium, bgColors.primary)}>
                                    <div className="p-2 space-y-1">
                                        {statusOptions.map((option) => (
                                            <Checkbox
                                                key={option.key}
                                                label={option.name}
                                                checked={filters.status.includes(option.key)}
                                                onChange={(e) => {
                                                    const newStatus = e.target.checked
                                                        ? [...filters.status, option.key]
                                                        : filters.status.filter(s => s !== option.key);
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
                            <label className={cn("block mb-1 text-sm font-medium", textColors.primary)}>
                                {t('tasks.filters.priority')}
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                className={cn("w-48 rounded-md border px-3 py-2 text-left text-sm shadow-sm outline-none transition", inputColors.base, inputColors.focus)}
                            >
                                {filters.priority.length === 0
                                    ? t('tasks.filters.allPriorities')
                                    : filters.priority.length === 1
                                        ? getPriorityName(filters.priority[0])
                                        : t('tasks.filters.priorityCount', { count: filters.priority.length })}
                                <svg className="float-right mt-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showPriorityDropdown && (
                                <div className={cn("absolute z-10 mt-1 w-48 rounded-md border shadow-lg", borderColors.medium, bgColors.primary)}>
                                    <div className="p-2 space-y-1">
                                        {priorityOptions.map((option) => (
                                            <Checkbox
                                                key={option.key}
                                                label={option.name}
                                                checked={filters.priority.includes(option.key)}
                                                onChange={(e) => {
                                                    const newPriority = e.target.checked
                                                        ? [...filters.priority, option.key]
                                                        : filters.priority.filter(p => p !== option.key);
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
                            label={t('tasks.filters.dateFrom')}
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="w-40"
                        />
                        <Input
                            label={t('tasks.filters.dateTo')}
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
                                <span className={cn("text-sm flex items-center gap-1", statusColors.warningText)}>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {t('tasks.actions.unsavedChanges')}
                                </span>
                            )}

                            <div className="flex gap-2 mt-1">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={!hasUnsavedChanges || isSaving}
                                >
                                    {t('tasks.actions.reset')}
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
                                            {t('tasks.actions.saving')}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            {t('tasks.actions.save')}
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
                                <Card key={status.key}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center justify-between text-base">
                                            <span>{status.name}</span>
                                            <Skeleton className="h-5 w-12 rounded-full" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="min-h-[350px] space-y-3 mt-1">
                                            {skeletonCards.map((_, idx) => (
                                                <div key={idx} className={cn("rounded-lg border p-4 space-y-3", borderColors.light, bgColors.muted)}>
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
                            {(column) => {
                                const statusIconData = getStatusIcon(column.id);
                                const StatusIcon = statusIconData.icon;

                                return (
                                    <KanbanBoard key={column.id} id={column.id} className="min-h-[500px]">
                                        <KanbanHeader className="flex items-center justify-between p-4 border-b">
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className={`w-4 h-4 ${statusIconData.color}`} />
                                                <span className="font-semibold">{column.name}</span>
                                            </div>
                                            <span className={cn("text-sm px-2 py-1 rounded-full", textColors.secondary, bgColors.muted)}>
                                                {kanbanData.filter(item => item.column === column.id).length}
                                            </span>
                                        </KanbanHeader>
                                        <KanbanCards id={column.id} className="min-h-[400px]">
                                            {(item) => {
                                                const timeRemaining = getTimeRemaining(item.dueDate);
                                                const isOverdue = timeRemaining && (timeRemaining.includes(t('tasks.timeRemaining.overdue', { days: 0, hours: 0, minutes: 0 }).split(' ')[0]) || timeRemaining.startsWith('Overdue'));
                                                const isSelected = selectedIds.has(item.id);

                                                return (
                                                    <KanbanCard
                                                        key={item.id}
                                                        id={item.id}
                                                        name={item.name}
                                                        column={item.column}
                                                        className={isSelected ? cn("cursor-pointer", statusColors.infoBorder, statusColors.infoBg) : "cursor-pointer"}
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
                                                                    <h4 className={cn("font-medium text-sm leading-tight flex-1", textColors.primary)}>
                                                                        {item.title || item.name}
                                                                    </h4>
                                                                </div>
                                                                {timeRemaining && (
                                                                    <span className={cn("text-xs flex-shrink-0", isOverdue ? statusColors.dangerText : statusColors.successText)}>
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
                                                                {item.priority && (() => {
                                                                    const iconData = getPriorityIcon(item.priority);
                                                                    if (iconData) {
                                                                        const PriorityIcon = iconData.icon;
                                                                        return (
                                                                            <div className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm">
                                                                                <PriorityIcon className={cn("w-4 h-4", iconData.color)} />
                                                                                <span className={textColors.primary}>{formatPriority(item.priority)}</span>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </KanbanCard>
                                                );
                                            }}
                                        </KanbanCards>
                                    </KanbanBoard>
                                );
                            }}
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
