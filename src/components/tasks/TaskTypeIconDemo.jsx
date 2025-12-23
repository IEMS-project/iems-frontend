import React from 'react';
import {
    getTaskTypeBgColor,
    getTaskTypeVariant,
    TASK_TYPES
} from '../../lib/taskTypeUtils';
import { useTaskType } from '../../hooks/useTaskType';
import Badge from '../ui/Badge';

/**
 * Component demo để hiển thị các loại icon task
 * Có thể sử dụng để test hoặc tham khảo
 */
export default function TaskTypeIconDemo() {
    const { getTaskTypeIcon, getTaskTypeColor, translateTaskType } = useTaskType();

    const taskTypes = [
        { type: 'TASK', name: 'Task' },
        { type: 'BUG', name: 'Bug' },
        { type: 'USER_STORY', name: 'User Story' },
        { type: 'EPIC', name: 'Epic' },
    ];

    return (
        <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Task Type Icons Demo
            </h3>

            {/* Hiển thị với icon và text */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Icon với màu sắc:
                </h4>
                {taskTypes.map(({ type, name }) => {
                    const Icon = getTaskTypeIcon(type);
                    const color = getTaskTypeColor(type);
                    const label = translateTaskType(type);

                    return (
                        <div key={type} className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${color}`} />
                            <span className="text-gray-900 dark:text-gray-100">
                                {label}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({type})
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Hiển thị với Badge */}
            <div className="space-y-3 mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Badge với icon:
                </h4>
                <div className="flex flex-wrap gap-2">
                    {taskTypes.map(({ type }) => {
                        const Icon = getTaskTypeIcon(type);
                        const variant = getTaskTypeVariant(type);
                        const label = translateTaskType(type);

                        return (
                            <Badge
                                key={type}
                                variant={variant}
                                className="inline-flex items-center gap-1.5"
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Hiển thị inline với background */}
            <div className="space-y-3 mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Inline với background:
                </h4>
                <div className="flex flex-wrap gap-3">
                    {taskTypes.map(({ type }) => {
                        const Icon = getTaskTypeIcon(type);
                        const color = getTaskTypeColor(type);
                        const bgColor = getTaskTypeBgColor(type);
                        const label = translateTaskType(type);

                        return (
                            <div
                                key={type}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md ${bgColor}`}
                            >
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className={color}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
