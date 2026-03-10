import React from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RichTextEditor from "@/components/ui/RichTextEditor";
import TaskComments from "./TaskComments";
import { getTaskTypeVariant } from "@/features/tasks/utils/taskTypeUtils";
import { useTaskType } from "@/features/tasks/hooks/useTaskType";
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Minus, Circle, Paperclip, Download, Hash, Layers, FolderKanban, Flag, User, CalendarDays, CalendarClock, Clock } from 'lucide-react';

export default function TaskDetailModal({ open, onClose, task, onEdit, onDelete }) {
    const { t } = useTranslation();
    const { getTaskTypeIcon, translateTaskType } = useTaskType();

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

        const normalized = priority.toString().trim().toUpperCase();

        // Highest/Critical
        if (normalized.includes('CAO NHẤT') || normalized === 'HIGHEST' || normalized === 'CRITICAL') {
            return { icon: ChevronsUp, color: 'text-red-700 dark:text-red-400' };
        }
        // High
        if (normalized === 'CAO' || normalized === 'HIGH') {
            return { icon: ChevronUp, color: 'text-red-600 dark:text-red-400' };
        }
        // Medium
        if (normalized.includes('TRUNG BÌNH') || normalized.includes('TRUNG BINH') || normalized === 'MEDIUM' || normalized === 'NORMAL') {
            return { icon: Minus, color: 'text-yellow-600 dark:text-yellow-400' };
        }
        // Low
        if (normalized.includes('THẤP') || normalized.includes('THAP') || normalized === 'LOW') {
            return { icon: ChevronDown, color: 'text-blue-600 dark:text-blue-400' };
        }
        // Lowest
        if (normalized.includes('THẤP NHẤT') || normalized.includes('THAP NHAT') || normalized === 'LOWEST') {
            return { icon: ChevronsDown, color: 'text-blue-700 dark:text-blue-400' };
        }
        // None/Default
        return { icon: Circle, color: 'text-gray-500 dark:text-gray-400' };
    };

    // Parse a date-only string ("YYYY-MM-DD") as local midnight to avoid UTC timezone shift
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.toString().split("T")[0].split("-").map(Number);
        return new Date(y, m - 1, d);
    };

    const getTimeRemaining = (dueDate, status, updatedAt) => {
        if (!dueDate) return null;
        
        // Check if task is done
        const isDone = status && ["Done", "DONE", "COMPLETED", "Completed"].includes(status.toString().trim());
        
        if (isDone && updatedAt) {
            const updated = new Date(updatedAt);
            const due = parseLocalDate(dueDate);
            if (updated <= due) {
                return t('tasks.detail.fields.completed');
            }
        }
        
        const today = new Date();
        // Parse due date as local end-of-day so it's not overdue until the next day
        const [y, m, d] = dueDate.toString().split("T")[0].split("-").map(Number);
        const due = new Date(y, m - 1, d, 23, 59, 59, 999);
        const diffTime = due - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

        if (diffTime < 0) {
            return t('tasks.timeRemaining.overdue', { days: Math.abs(diffDays), hours: Math.abs(diffHours), minutes: Math.abs(diffMinutes) });
        } else if (diffDays === 0 && diffHours === 0) {
            return t('tasks.timeRemaining.remainingMinutes', { minutes: diffMinutes });
        } else if (diffDays === 0) {
            return t('tasks.timeRemaining.remainingHours', { hours: diffHours, minutes: diffMinutes });
        } else {
            return t('tasks.timeRemaining.remainingDays', { days: diffDays, hours: diffHours, minutes: diffMinutes });
        }
    };

    const formatDueDate = (dueDate) => {
        if (!dueDate) return null;
        const date = parseLocalDate(dueDate);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (!task) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={task.title || t('tasks.detail.title')}
            footer={
                <div className="flex justify-between gap-2">
                    <div>
                        {onDelete && (
                            <Button variant="destructive" onClick={() => onDelete(task)}>
                                {t('ui.common.delete')}
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="secondary" onClick={() => onEdit(task)}>
                                {t('ui.common.edit')}
                            </Button>
                        )}
                        <Button variant="secondary" onClick={onClose}>{t('ui.common.close')}</Button>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side - Description & Attachments */}
                <div className="lg:col-span-2 space-y-6">
                    {task.description && (
                        <div>
                            <div className="text-sm font-semibold text-foreground mb-3">{t('tasks.detail.fields.description')}</div>
                            <RichTextEditor
                                value={task.description}
                                readOnly={true}
                            />
                        </div>
                    )}

                    {task.attachments && task.attachments.length > 0 && (
                        <div>
                            <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                {t('tasks.detail.fields.attachments') || 'File đính kèm'} ({task.attachments.length})
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {/* Hiển thị ảnh trước */}
                                {task.attachments
                                    .filter(attachment => {
                                        const fileName = attachment.fileName || attachment.name || '';
                                        return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
                                    })
                                    .map((attachment) => {
                                        const fileName = attachment.fileName || attachment.name || '';
                                        return (
                                            <div key={attachment.id} className="relative group aspect-square">
                                                <img
                                                    src={attachment.fileUrl}
                                                    alt={fileName}
                                                    className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(attachment.fileUrl, '_blank')}
                                                    title="Nhấn để xem ảnh"
                                                />
                                                <a
                                                    href={attachment.fileUrl}
                                                    download
                                                    className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-gray-800/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    title={t('ui.common.download') || 'Tải xuống'}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                                                </a>
                                            </div>
                                        );
                                    })}

                                {/* Hiển thị file thường sau */}
                                {task.attachments
                                    .filter(attachment => {
                                        const fileName = attachment.fileName || attachment.name || '';
                                        return !/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
                                    })
                                    .map((attachment) => {
                                        const fileName = attachment.fileName || attachment.name || '';
                                        return (
                                            <div
                                                key={attachment.id}
                                                className="col-span-3 flex items-center gap-2 p-2 bg-muted rounded-md text-sm"
                                            >
                                                <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <span className="truncate text-foreground flex-1" title={fileName}>
                                                    {fileName}
                                                </span>
                                                <a
                                                    href={attachment.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                                    title={t('ui.common.download') || 'Tải xuống'}
                                                >
                                                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </a>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <TaskComments taskId={task.id} />
                    </div>
                </div>

                {/* Right side - Details */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="text-sm font-semibold text-foreground mb-3">{t('tasks.detail.fields.details')}</div>

                    {/* Hide task.id (UUID) - not user-friendly */}

                    {task.type && (
                        <div>
                            <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" />
                                {t('tasks.detail.fields.type')}
                            </div>
                            <div className="text-sm text-foreground mt-1">
                                <Badge variant={getTaskTypeVariant(task.type)} className="inline-flex items-center gap-1.5">
                                    {React.createElement(getTaskTypeIcon(task.type), { className: "w-3.5 h-3.5" })}
                                    {translateTaskType(task.type)}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                            <FolderKanban className="w-3.5 h-3.5" />
                            {t('tasks.detail.fields.project')}
                        </div>
                        <div className="text-sm text-foreground mt-1">
                            <Badge variant="black" className="font-normal">
                                {(task.project && task.project.name) || task.projectName || task.project || '-'}
                            </Badge>
                        </div>
                    </div>

                    {task.priority && (
                        <div>
                            <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                                <Flag className="w-3.5 h-3.5" />
                                {t('tasks.detail.fields.priority')}
                            </div>
                            <div className="text-sm text-foreground mt-1 inline-flex items-center gap-1.5">
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
                            <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                {t('tasks.detail.fields.assignee')}
                            </div>
                            <div className="text-sm text-foreground mt-1">
                                {task.userName || task.assignedToName || task.assigneeName ||
                                    (task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo.name : task.assignedTo) ||
                                    task.assignedToEmail || task.assigneeEmail || '-'}
                            </div>
                        </div>
                    )}

                    {task.startDate && (
                        <div>
                            <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {t('tasks.detail.fields.startDate')}
                            </div>
                            <div className="text-sm text-foreground mt-1">
                                {parseLocalDate(task.startDate)?.toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                    )}

                    {task.dueDate && (() => {
                        // Check if task is done before due date
                        const isDone = task.status && ["Done", "DONE", "COMPLETED", "Completed"].includes(task.status.toString().trim());
                        if (isDone && task.updatedAt) {
                            const updated = new Date(task.updatedAt);
                            const due = new Date(task.dueDate);
                            // If done before due date, don't show dueDate
                            if (updated <= due) {
                                return null;
                            }
                        }
                        return (
                            <div>
                                <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    {t('tasks.detail.fields.dueDate')}
                                </div>
                                <div className="text-sm text-foreground mt-1">
                                    {formatDueDate(task.dueDate)}
                                </div>
                            </div>
                        );
                    })()}

                    {task.dueDate && getTimeRemaining(task.dueDate, task.status, task.updatedAt) && (
                        <div>
                            <div className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {t('tasks.detail.fields.timeRemaining')}
                            </div>
                            <div className="text-sm text-foreground mt-1">
                                {getTimeRemaining(task.dueDate, task.status, task.updatedAt)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
