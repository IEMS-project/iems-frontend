import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import KanbanColumn from "../components/tasks/KanbanColumn";
import TaskDetailModal from "../components/tasks/TaskDetailModal";

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
            setDraggedTask(null);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };


    return (
        <>
            <MainLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Nhiệm vụ</h1>
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
            </MainLayout>

            {/* Task Detail Modal */}
            <TaskDetailModal
                open={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                task={selectedTask}
            />
        </>
    );
}
