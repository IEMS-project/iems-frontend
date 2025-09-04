import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function TaskDetailModal({ open, onClose, task }) {
    const getTimeRemaining = (dueDate) => {
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
            title={task.title}
            footer={
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Đóng</Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mã nhiệm vụ</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{task.id}</div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Dự án</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{task.project}</div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Hạn hoàn thành</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{formatDueDate(task.dueDate)}</div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian còn lại</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                            {getTimeRemaining(task.dueDate)}
                        </div>
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{task.description}</div>
                </div>
            </div>
        </Modal>
    );
}


