import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { useParams } from "react-router-dom";
import TaskDetailModal from "./TaskDetailModal";

export default function ProjectTimeline({ tasks = [] }) {
    const { projectId } = useParams();
    const [zoom, setZoom] = useState("months"); // weeks | months | quarters
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);

    const visibleRange = useMemo(() => {
        const s = new Date(anchorDate);
        const e = new Date(anchorDate);
        if (zoom === "weeks") {
            s.setDate(s.getDate() - 21);
            e.setDate(e.getDate() + 21);
            return { start: s, end: e };
        }
        if (zoom === "months") {
            s.setMonth(s.getMonth() - 3);
            e.setMonth(e.getMonth() + 3);
            return { start: s, end: e };
        }
        s.setMonth(s.getMonth() - 6);
        e.setMonth(e.getMonth() + 6);
        return { start: s, end: e };
    }, [anchorDate, zoom]);

    const timelineTicks = useMemo(() => {
        const { start, end } = visibleRange;
        const ticks = [];
        const cursor = new Date(start);
        if (zoom === "weeks") {
            while (cursor <= end) {
                ticks.push({ key: cursor.toISOString(), label: cursor.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), date: new Date(cursor) });
                cursor.setDate(cursor.getDate() + 7);
            }
        } else if (zoom === "months") {
            while (cursor <= end) {
                ticks.push({ key: cursor.toISOString(), label: cursor.toLocaleDateString("vi-VN", { month: "short", year: "numeric" }), date: new Date(cursor) });
                cursor.setMonth(cursor.getMonth() + 1);
            }
        } else {
            while (cursor <= end) {
                const q = Math.floor(cursor.getMonth() / 3) + 1;
                ticks.push({ key: cursor.toISOString(), label: `Q${q} ${cursor.getFullYear()}`, date: new Date(cursor) });
                cursor.setMonth(cursor.getMonth() + 3);
            }
        }
        return ticks;
    }, [visibleRange, zoom]);

    const priorityColor = (priority) => {
        switch ((priority || "").toUpperCase()) {
            case "CRITICAL":
                return "bg-red-600";
            case "HIGH":
                return "bg-orange-500";
            case "MEDIUM":
                return "bg-yellow-400";
            case "LOW":
                return "bg-green-500";
            default:
                return "bg-gray-400";
        }
    };

    const clampToRange = (d) => {
        const { start, end } = visibleRange;
        return new Date(Math.min(Math.max(d.getTime(), start.getTime()), end.getTime()));
    };

    const positionForTask = (task) => {
        const { start, end } = visibleRange;
        const tStart = new Date(task.startDate || task.dueDate || task.start || task.beginDate || Date.now());
        const tEnd = new Date(task.endDate || task.dueDate || task.finishDate || task.startDate || tStart);
        const visibleStart = start.getTime();
        const visibleEnd = end.getTime();
        const total = visibleEnd - visibleStart;
        if (total <= 0) return { left: 0, width: 0 };
        const clampedStart = clampToRange(tStart).getTime();
        const clampedEnd = clampToRange(tEnd).getTime();
        const leftPct = ((clampedStart - visibleStart) / total) * 100;
        const widthPct = Math.max(0.5, ((clampedEnd - clampedStart) / total) * 100);
        return { left: leftPct, width: widthPct };
    };

    const todayPercent = useMemo(() => {
        const { start, end } = visibleRange;
        const now = Date.now();
        const total = end.getTime() - start.getTime();
        if (total <= 0) return -1;
        const pct = ((now - start.getTime()) / total) * 100;
        return pct;
    }, [visibleRange]);

    const handleBarClick = (task) => setSelectedTask(task);
    const closeModal = () => setSelectedTask(null);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Timeline</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant={zoom === "weeks" ? "primary" : "secondary"} onClick={() => setZoom("weeks")}>Weeks</Button>
                        <Button variant={zoom === "months" ? "primary" : "secondary"} onClick={() => setZoom("months")}>Months</Button>
                        <Button variant={zoom === "quarters" ? "primary" : "secondary"} onClick={() => setZoom("quarters")}>Quarters</Button>
                        <div className="ml-2 flex items-center gap-2">
                            <Button variant="secondary" onClick={() => setAnchorDate(new Date())}>Today</Button>
                            <Button variant="secondary" onClick={() => setAnchorDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() - (zoom === "weeks" ? 1 : zoom === "months" ? 1 : 3), anchorDate.getDate()))}>{"<"}</Button>
                            <Button variant="secondary" onClick={() => setAnchorDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() + (zoom === "weeks" ? 1 : zoom === "months" ? 1 : 3), anchorDate.getDate()))}>{">"}</Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px] relative">
                        {/* Continuous Today marker across header + rows */}
                        {todayPercent >= 0 && todayPercent <= 100 && (
                            <div className="pointer-events-none absolute top-0 bottom-0 z-20" style={{ left: `calc(240px + (100% - 240px) * ${todayPercent} / 100)` }}>
                                <div className="h-full w-0.5 bg-blue-500/70" />
                            </div>
                        )}

                        {/* Header scale */}
                        <div className="grid" style={{ gridTemplateColumns: `240px repeat(${timelineTicks.length}, minmax(100px, 1fr))` }}>
                            <div className="sticky left-0 z-10 bg-white dark:bg-gray-900 border-b py-2 px-3 text-xs font-semibold text-gray-600">Tasks</div>
                            {timelineTicks.map((t) => (
                                <div key={t.key} className="border-b py-2 text-center text-xs text-gray-500">
                                    {t.label}
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div>
                            {tasks && tasks.length ? tasks.map((task) => {
                                const pos = positionForTask(task);
                                const s = new Date(task.startDate || task.dueDate || task.start);
                                const e = new Date(task.endDate || task.dueDate || task.startDate || s);
                                const name = task.name || task.title;
                                return (
                                    <div key={task.id || task.taskId} className="grid" style={{ gridTemplateColumns: `240px 1fr` }}>
                                        {/* Left: task name */}
                                        <div className="sticky left-0 z-10 bg-white dark:bg-gray-900 border-b py-3 px-3 text-sm text-gray-800 dark:text-gray-100">
                                            <div className="flex items-center gap-2 h-6">
                                                <span className="truncate" title={name}>{name}</span>
                                            </div>
                                        </div>
                                        {/* Right: timeline cell */}
                                        <div className="relative border-b py-3">
                                            {/* Bar */}
                                            <button className={`group absolute top-2 h-8 rounded-md ${priorityColor(task.priority)} hover:brightness-110 transition focus:outline-none`} style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                                                title={`${new Date(task.startDate || task.start).toLocaleDateString("vi-VN")} → ${new Date(task.endDate || task.dueDate || task.startDate).toLocaleDateString("vi-VN")}`}
                                                onClick={() => handleBarClick(task)}
                                            />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="py-6 text-center text-sm text-gray-500">Không có task nào</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-600"></span> Critical</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-orange-500"></span> High</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-yellow-400"></span> Medium</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-green-500"></span> Low</div>
                </div>
            </CardContent>

            <TaskDetailModal open={!!selectedTask} onClose={closeModal} task={selectedTask} />
        </Card>
    );
}


