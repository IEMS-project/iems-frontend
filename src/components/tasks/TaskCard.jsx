import React from "react";
import Badge from "../ui/Badge";

export default function TaskCard({ task, status, onDragStart, onClick, selected = false }) {
    const getTimeRemaining = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

        if (diffTime < 0) {
            return `Quá hạn ${Math.abs(diffDays)}d`;
        } else if (diffDays === 0 && diffHours === 0) {
            return `Còn ${diffMinutes}m`;
        } else if (diffDays === 0) {
            return `Còn ${diffHours}h`;
        } else {
            return `Còn ${diffDays}d`;
        }
    };

    const getPriorityVariant = (priority) => {
        if (!priority) return "gray";
        const priorityUpper = priority.toString().toUpperCase();
        if (["CAO", "HIGH"].includes(priorityUpper)) return "red";
        if (["TRUNG BÌNH", "TRUNG BINH", "MEDIUM"].includes(priorityUpper)) return "yellow";
        if (["THẤP", "THAP", "LOW"].includes(priorityUpper)) return "green";
        return "gray";
    };

    const formatPriority = (priority) => {
        if (!priority) return "N/A";
        const priorityUpper = priority.toString().toUpperCase();
        if (["HIGH", "CAO"].includes(priorityUpper)) return "Cao";
        if (["MEDIUM", "TRUNG BÌNH", "TRUNG BINH"].includes(priorityUpper)) return "Trung bình";
        if (["LOW", "THẤP", "THAP"].includes(priorityUpper)) return "Thấp";
        return priority;
    };

    const timeRemaining = getTimeRemaining(task.dueDate);
    const isOverdue = timeRemaining && timeRemaining.includes("Quá hạn");

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task, status)}
            onClick={() => onClick(task)}
            className={"p-3 rounded-md border cursor-pointer transition-all hover:shadow-sm " + (selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900")}
        >
            <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight flex-1 text-gray-900 dark:text-gray-100">
                        {task.title}
                    </h4>
                    {task.priority && (
                        <Badge variant={getPriorityVariant(task.priority)} className="flex-shrink-0">
                            {formatPriority(task.priority)}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {task.project}
                    </div>
                    {timeRemaining && (
                        <span className={`text-xs flex-shrink-0 ${isOverdue ? "text-red-500" : "text-green-500"}`}>
                            {timeRemaining}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}


