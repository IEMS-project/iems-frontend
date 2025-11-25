import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { getPriorityVariant, getStatusVariant, translatePriority, translateStatus } from "../../lib/i18n";
import RichTextEditor from "../ui/RichTextEditor";
import { getTaskTypeIcon, getTaskTypeColor, translateTaskType, getTaskTypeVariant } from "../../lib/taskTypeUtils";
import { ChevronUp, ChevronDown, Equal } from 'lucide-react';

export default function TaskDetailModal({ open, onClose, task, onEdit }) {
    const getTimeRemaining = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

        if (diffTime < 0) {
            return `Quá hạn ${Math.abs(diffDays)} ngày ${Math.abs(diffHours)} giờ ${Math.abs(diffMinutes)} phút`;
        } else if (diffDays === 0 && diffHours === 0) {
            return `Còn ${diffMinutes} phút`;
        } else if (diffDays === 0) {
            return `Còn ${diffHours} giờ ${diffMinutes} phút`;
        } else {
            return `Còn ${diffDays} ngày ${diffHours} giờ ${diffMinutes} phút`;
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
            title={task.title || "Chi tiết nhiệm vụ"}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side - Description */}
                <div className="lg:col-span-2">
                    {task.description && (
                        <div>
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Mô tả</div>
                            <RichTextEditor
                                value={task.description}
                                readOnly={true}
                            />
                        </div>
                    )}
                </div>

                {/* Right side - Details */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Chi tiết</div>

                    {task.id && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Mã nhiệm vụ</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">{task.id}</div>
                        </div>
                    )}

                    {task.type && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Loại</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                <Badge variant={getTaskTypeVariant(task.type)} className="inline-flex items-center gap-1.5">
                                    {React.createElement(getTaskTypeIcon(task.type), { className: "w-3.5 h-3.5" })}
                                    {translateTaskType(task.type)}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Dự án</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                            <Badge variant="black" className="font-normal">
                                {(task.project && task.project.name) || task.projectName || task.project || '-'}
                            </Badge>
                        </div>
                    </div>

                    {task.status && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Trạng thái</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                <Badge variant={getStatusVariant(task.status)}>
                                    {translateStatus(task.status)}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {task.priority && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Ưu tiên</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 inline-flex items-center gap-1.5">
                                {translatePriority(task.priority) === 'Cao' && <ChevronUp className="w-4 h-4 text-red-600 dark:text-red-400" />}
                                {translatePriority(task.priority) === 'Trung bình' && <Equal className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                                {translatePriority(task.priority) === 'Thấp' && <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                <span>{translatePriority(task.priority)}</span>
                            </div>
                        </div>
                    )}

                    {(task.userName || task.assignedToName || task.assigneeName || task.assignedTo) && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Người thực hiện</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {task.userName || task.assignedToName || task.assigneeName ||
                                    (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.name : task.assignedTo) ||
                                    task.assignedToEmail || task.assigneeEmail || '-'}
                            </div>
                        </div>
                    )}

                    {task.startDate && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Bắt đầu</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {new Date(task.startDate).toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                    )}

                    {task.dueDate && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Hạn hoàn thành</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {formatDueDate(task.dueDate)}
                            </div>
                        </div>
                    )}

                    {task.dueDate && getTimeRemaining(task.dueDate) && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">Thời gian còn lại</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {getTimeRemaining(task.dueDate)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
