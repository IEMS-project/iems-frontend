import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import KanbanColumn from "../components/tasks/KanbanColumn";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/ui/Button";
import { taskService } from "../services/taskService";

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

    // Load tasks from backend: my-tasks across all projects
    useEffect(() => {
        const load = async () => {
            try {
                const list = await taskService.getMyTasks();
                // list is TaskResponseDto (flat); group into Kanban columns by status display name
                const group = { "Chờ": [], "Đang làm": [], "Hoàn thành": [] };
                for (const t of Array.isArray(list) ? list : []) {
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
                    });
                }
                setTasks(group);
                setSavedTasks(group);
            } catch (e) {
                console.error('Error loading my tasks:', e);
            }
        };
        load();
    }, []);

    // Save tasks: no-op (state reflects backend already via bulk update)
    const handleSave = async () => {
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
                <div className="flex items-center justify-between">
                    <PageHeader breadcrumbs={[{ label: "Nhiệm vụ", to: "/tasks" }]} />
                    
                    {/* Save/Reset Controls */}
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
