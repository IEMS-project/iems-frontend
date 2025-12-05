import React from "react";
import { useTranslation } from "react-i18next";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { getPriorityVariant, getStatusVariant } from "../../lib/i18n";
import RichTextEditor from "../ui/RichTextEditor";
import { getTaskTypeIcon, getTaskTypeColor, translateTaskType, getTaskTypeVariant } from "../../lib/taskTypeUtils";
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Minus, Circle } from 'lucide-react';

export default function TaskDetailModal({ open, onClose, task, onEdit }) {
    const { t } = useTranslation();

    const getPriorityLabel = (priority) => {
        if (!priority) return t('dashboard.priority.medium');

        // Normalize priority - trim and handle variations
        const normalizedPriority = priority.toString().trim();

        const priorityMap = {
            'Cao nhất': 'highest',
            'Cao': 'high',
            'Trung bình': 'medium',
            'Thấp': 'low',
            'Thấp nhất': 'lowest',
            'Không ưu tiên': 'none',
            // English mappings
            'Highest': 'highest',
            'Critical': 'highest',
            'High': 'high',
            'Medium': 'medium',
            'Normal': 'medium',
            'Low': 'low',
            'Lowest': 'lowest',
            'None': 'none'
        };

        const key = priorityMap[normalizedPriority];
        if (key) {
            return t(`dashboard.priority.${key}`);
        }

        // Fallback: try case-insensitive match
        const lowerPriority = normalizedPriority.toLowerCase();
        for (const [mapKey, mapValue] of Object.entries(priorityMap)) {
            if (mapKey.toLowerCase() === lowerPriority) {
                return t(`dashboard.priority.${mapValue}`);
            }
        }

        return t('dashboard.priority.medium');
    };

    const getPriorityIcon = (priority) => {
        if (!priority) return null;

        const normalized = priority.toString().trim();
        const priorityIcons = {
            'Cao nhất': { icon: ChevronsUp, color: 'text-red-700 dark:text-red-400' },
            'Highest': { icon: ChevronsUp, color: 'text-red-700 dark:text-red-400' },
            'Critical': { icon: ChevronsUp, color: 'text-red-700 dark:text-red-400' },
            'Cao': { icon: ChevronUp, color: 'text-red-600 dark:text-red-400' },
            'High': { icon: ChevronUp, color: 'text-red-600 dark:text-red-400' },
            'Trung bình': { icon: Minus, color: 'text-yellow-600 dark:text-yellow-400' },
            'Medium': { icon: Minus, color: 'text-yellow-600 dark:text-yellow-400' },
            'Normal': { icon: Minus, color: 'text-yellow-600 dark:text-yellow-400' },
            'Thấp': { icon: ChevronDown, color: 'text-blue-600 dark:text-blue-400' },
            'Low': { icon: ChevronDown, color: 'text-blue-600 dark:text-blue-400' },
            'Thấp nhất': { icon: ChevronsDown, color: 'text-blue-700 dark:text-blue-400' },
            'Lowest': { icon: ChevronsDown, color: 'text-blue-700 dark:text-blue-400' },
            'Không ưu tiên': { icon: Circle, color: 'text-gray-500 dark:text-gray-400' },
            'None': { icon: Circle, color: 'text-gray-500 dark:text-gray-400' }
        };

        return priorityIcons[normalized] || priorityIcons['Trung bình'];
    };

    const getStatusLabel = (status) => {
        if (!status) return t('dashboard.status.unknown');

        // Normalize status - trim and handle case insensitivity
        const normalizedStatus = status.toString().trim();

        const statusMap = {
            'Đang chờ': 'pending',
            'Đang thực hiện': 'inProgress',
            'Đang duyệt': 'inReview',
            'Hoàn thành': 'completed',
            'Bị chặn': 'blocked',
            'Đã hủy': 'cancelled',
            'Tạm ngừng': 'onHold',
            'Chưa xác định': 'unknown',
            // English mappings
            'Pending': 'pending',
            'To Do': 'pending',
            'In Progress': 'inProgress',
            'In Review': 'inReview',
            'Completed': 'completed',
            'Done': 'completed',
            'Blocked': 'blocked',
            'Cancelled': 'cancelled',
            'On Hold': 'onHold',
            'Unknown': 'unknown'
        };

        const key = statusMap[normalizedStatus];
        if (key) {
            return t(`dashboard.status.${key}`);
        }

        // Fallback: try case-insensitive match
        const lowerStatus = normalizedStatus.toLowerCase();
        for (const [mapKey, mapValue] of Object.entries(statusMap)) {
            if (mapKey.toLowerCase() === lowerStatus) {
                return t(`dashboard.status.${mapValue}`);
            }
        }

        return t('dashboard.status.unknown');
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
            return t('tasks.detail.overdue', { days: Math.abs(diffDays), hours: Math.abs(diffHours), minutes: Math.abs(diffMinutes) });
        } else if (diffDays === 0 && diffHours === 0) {
            return t('tasks.detail.remainingMinutes', { minutes: diffMinutes });
        } else if (diffDays === 0) {
            return t('tasks.detail.remainingHours', { hours: diffHours, minutes: diffMinutes });
        } else {
            return t('tasks.detail.remainingDays', { days: diffDays, hours: diffHours, minutes: diffMinutes });
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
            title={task.title || t('tasks.detail.title')}
            footer={
                <div className="flex justify-end gap-2">
                    {onEdit && (
                        <Button variant="secondary" onClick={() => onEdit(task)}>
                            {t('ui.common.edit')}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>{t('ui.common.close')}</Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side - Description */}
                <div className="lg:col-span-2">
                    {task.description && (
                        <div>
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('tasks.detail.fields.description')}</div>
                            <RichTextEditor
                                value={task.description}
                                readOnly={true}
                            />
                        </div>
                    )}
                </div>

                {/* Right side - Details */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('tasks.detail.fields.details')}</div>

                    {task.id && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.taskId')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">{task.id}</div>
                        </div>
                    )}

                    {task.type && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.type')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                <Badge variant={getTaskTypeVariant(task.type)} className="inline-flex items-center gap-1.5">
                                    {React.createElement(getTaskTypeIcon(task.type), { className: "w-3.5 h-3.5" })}
                                    {translateTaskType(task.type)}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.project')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                            <Badge variant="black" className="font-normal">
                                {(task.project && task.project.name) || task.projectName || task.project || '-'}
                            </Badge>
                        </div>
                    </div>

                    {task.status && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.status')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                <Badge variant={getStatusVariant(task.status)}>
                                    {getStatusLabel(task.status)}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {task.priority && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.priority')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 inline-flex items-center gap-1.5">
                                {(() => {
                                    const iconData = getPriorityIcon(task.priority);
                                    if (iconData) {
                                        const Icon = iconData.icon;
                                        return <Icon className={`w-4 h-4 ${iconData.color}`} />;
                                    }
                                    return null;
                                })()}
                                <span>{getPriorityLabel(task.priority)}</span>
                            </div>
                        </div>
                    )}

                    {(task.userName || task.assignedToName || task.assigneeName || task.assignedTo) && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.assignee')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {task.userName || task.assignedToName || task.assigneeName ||
                                    (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.name : task.assignedTo) ||
                                    task.assignedToEmail || task.assigneeEmail || '-'}
                            </div>
                        </div>
                    )}

                    {task.startDate && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.startDate')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {new Date(task.startDate).toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                    )}

                    {task.dueDate && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.dueDate')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {formatDueDate(task.dueDate)}
                            </div>
                        </div>
                    )}

                    {task.dueDate && getTimeRemaining(task.dueDate) && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">{t('tasks.detail.fields.timeRemaining')}</div>
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
