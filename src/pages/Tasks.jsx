import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import KanbanColumn from "../components/tasks/KanbanColumn";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/ui/Button";

const initialTasks = {
    "Chờ": [
        { id: "T-101", title: "Thiết kế kiến trúc", project: "IEMS Platform", dueDate: "2025-10-15T14:30", description: "Thiết kế kiến trúc tổng thể cho hệ thống" },
        { id: "T-103", title: "UI Dashboard", project: "IEMS Platform", dueDate: "2025-11-01T09:00", description: "Thiết kế giao diện dashboard chính" },
    ],
    "Đang làm": [
        { id: "T-102", title: "API xác thực", project: "IEMS Platform", dueDate: "2025-10-20T16:00", description: "Phát triển API xác thực người dùng" },
        { id: "T-104", title: "Database Schema", project: "IEMS Platform", dueDate: "2025-10-25T11:30", description: "Thiết kế cấu trúc cơ sở dữ liệu" },
    ],
    "Hoàn thành": [
        { id: "T-100", title: "Setup Project", project: "IEMS Platform", dueDate: "2025-09-30T10:00", description: "Khởi tạo dự án và cấu hình ban đầu" },
    ]
};

export default function Tasks() {
    const [tasks, setTasks] = useState(initialTasks);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedTasks, setSavedTasks] = useState(initialTasks);


    const handleDragStart = (e, task, status) => {
        setDraggedTask({ ...task, sourceStatus: status });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        if (draggedTask && draggedTask.sourceStatus !== targetStatus) {
            const newTasks = { ...tasks };

            // Remove from source
            newTasks[draggedTask.sourceStatus] = newTasks[draggedTask.sourceStatus].filter(
                t => t.id !== draggedTask.id
            );

            // Add to target
            newTasks[targetStatus] = [...newTasks[targetStatus], { ...draggedTask, status: targetStatus }];

            setTasks(newTasks);
            setHasUnsavedChanges(true);
            setDraggedTask(null);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    // Load tasks from localStorage on component mount
    useEffect(() => {
        const savedTasksData = localStorage.getItem('iems-tasks');
        if (savedTasksData) {
            try {
                const parsedTasks = JSON.parse(savedTasksData);
                setTasks(parsedTasks);
                setSavedTasks(parsedTasks);
            } catch (error) {
                console.error('Error loading tasks from localStorage:', error);
            }
        }
    }, []);

    // Save tasks to localStorage
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Save to localStorage (in real app, this would be an API call)
            localStorage.setItem('iems-tasks', JSON.stringify(tasks));
            setSavedTasks(tasks);
            setHasUnsavedChanges(false);
            
            // Show success message (you can add a toast notification here)
            console.log('Tasks saved successfully!');
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
