import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function TaskDetailModal({ open, onClose, task, onEdit }) {
    const statusVariant = (status) => {
        switch (status) {
            case "Hoàn thành": return "green";
            case "Đang làm": return "blue";
            case "Chờ": return "yellow";
            default: return "gray";
        }
    };

    const priorityVariant = (priority) => {
        switch (priority) {
            case "Cao": return "red";
            case "Trung bình": return "yellow";
            case "Thấp": return "blue";
            default: return "gray";
        }
    };

    const getTimeRemaining = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

        if (diffTime < 0) {
            return `Quá hạn ${Math.abs(diffDays)}d ${Math.abs(diffHours)}h ${Math.abs(diffMinutes)}m`;
        } else if (diffDays === 0 && diffHours === 0) {
            return `Còn ${diffMinutes}m`;
        } else if (diffDays === 0) {
            return `Còn ${diffHours}h ${diffMinutes}m`;
        } else {
            return `Còn ${diffDays}d ${diffHours}h ${diffMinutes}m`;
        }
    };

    const formatDueDate = (dueDate) => {
        if (!dueDate) return null;
        const date = new Date(dueDate);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!task) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={task.title || "Chi tiết task"}
            footer={
                <div className="flex justify-end gap-2">
                    {onEdit && (
                        <Button variant="secondary" onClick={() => onEdit(task)}>
                            Chỉnh sửa
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>Đóng</Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {task.id && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Mã nhiệm vụ</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">{task.id}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Dự án</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                            {(task.project && task.project.name) || task.projectName || task.project || '-'}
                        </div>
                    </div>
                    {task.status && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Trạng thái</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                            </div>
                        </div>
                    )}
                    {task.priority && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Ưu tiên</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                            </div>
                        </div>
                    )}
                    {(task.userName || task.assignedToName || task.assigneeName || task.assignedTo) && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Người thực hiện</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                {task.userName || task.assignedToName || task.assigneeName || 
                                 (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.name : task.assignedTo) || 
                                 task.assignedToEmail || task.assigneeEmail || '-'}
                            </div>
                        </div>
                    )}
                    {task.startDate && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Bắt đầu</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                {new Date(task.startDate).toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                    )}
                    {task.dueDate && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Hạn hoàn thành</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                {formatDueDate(task.dueDate)}
                            </div>
                        </div>
                    )}
                    {task.dueDate && getTimeRemaining(task.dueDate) && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Thời gian còn lại</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                {getTimeRemaining(task.dueDate)}
                            </div>
                        </div>
                    )}
                </div>
                {task.description && (
                    <div>
                        <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Mô tả</div>
                        <div className="whitespace-pre-wrap rounded border p-3 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800">
                            {task.description}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
