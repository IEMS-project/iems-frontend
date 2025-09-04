import React from "react";

export default function TaskCard({ task, status, onDragStart, onClick }) {
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

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task, status)}
            onClick={() => onClick(task)}
            className="p-3 rounded-md border border-gray-200 bg-white cursor-pointer transition-all hover:shadow-sm hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
        >
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm leading-tight flex-1 text-gray-900 dark:text-gray-100">
                        {task.title}
                    </h4>
                    <span className="text-xs text-green-500 ml-2 flex-shrink-0">
                        {getTimeRemaining(task.dueDate)}
                    </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                    {task.project}
                </div>
            </div>
        </div>
    );
}


