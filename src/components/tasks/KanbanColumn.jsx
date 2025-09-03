import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import TaskCard from "../tasks/TaskCard";

export default function KanbanColumn({ status, tasks, onDragOver, onDrop, onDragStart, onTaskClick }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                    <span>{status}</span>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {tasks.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div
                    className="min-h-[350px] space-y-2 mt-1"
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, status)}
                >
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            status={status}
                            onDragStart={onDragStart}
                            onClick={onTaskClick}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
