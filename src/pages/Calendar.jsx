import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/common/PageHeader";

const HOURS_START = 7; // 07:00
const HOURS_END = 19;  // 19:00

function formatDateKey(date) {
    return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0-6 (Sun-Sat)
    const diff = (day === 0 ? -6 : 1) - day; // start from Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Sample tasks. In real app, fetch from API/store
const initialTasks = [
    {
        id: "t1",
        title: "Họp sprint",
        start: new Date(new Date().setHours(9, 0, 0, 0)),
        end: new Date(new Date().setHours(10, 0, 0, 0)),
        assignee: "Nhóm IEMS",
        status: 'in_progress',
    },
    {
        id: "t2",
        title: "Review thiết kế",
        start: addDays(new Date(new Date().setHours(13, 30, 0, 0)), 1),
        end: addDays(new Date(new Date().setHours(15, 0, 0, 0)), 1),
        assignee: "UI/UX",
        status: 'todo',
    },
    {
        id: "t3",
        title: "Triển khai môi trường",
        start: addDays(new Date(new Date().setHours(10, 0, 0, 0)), 3),
        end: addDays(new Date(new Date().setHours(12, 0, 0, 0)), 3),
        assignee: "DevOps",
        status: 'in_progress',
    },
    {
        id: "t4",
        title: "Báo cáo tuần",
        start: addDays(new Date(new Date().setHours(16, 0, 0, 0)), 4),
        end: addDays(new Date(new Date().setHours(17, 0, 0, 0)), 4),
        assignee: "PM",
        status: 'done',
    },
    // Multi-day task example: spans across multiple days
    {
        id: "t5",
        title: "Triển khai dự án A (đa ngày)",
        start: addDays(new Date(new Date().setHours(17, 0, 0, 0)), 0),
        end: addDays(new Date(new Date().setHours(11, 0, 0, 0)), 2),
        assignee: "Team dự án",
        status: 'in_progress',
    },
];

export default function CalendarPage() {
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const hours = useMemo(() => Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i), []);

    function dayWindow(day) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }

    function visibleHoursWindow(day) {
        const start = new Date(day);
        start.setHours(HOURS_START, 0, 0, 0);
        const end = new Date(day);
        end.setHours(HOURS_END, 0, 0, 0);
        return { start, end };
    }

    function overlapsDay(task, day) {
        const { start, end } = dayWindow(day);
        return task.start < end && task.end > start;
    }

    function isAllDayOnDay(task, day) {
        if (!overlapsDay(task, day)) return false;
        const { start: visStart, end: visEnd } = visibleHoursWindow(day);
        const spansMultipleDays = task.start.toDateString() !== task.end.toDateString() || (task.end - task.start) >= 24 * 60 * 60 * 1000;
        const coversWorkHours = task.start <= visStart && task.end >= visEnd;
        return spansMultipleDays || coversWorkHours;
    }

    function getStatusClasses(status) {
        switch (status) {
            case 'todo':
                return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800' };
            case 'in_progress':
                return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' };
            case 'done':
                return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' };
            default:
                return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
        }
    }

    // Layout overlapping tasks into lanes for each day
    const dayLayouts = useMemo(() => {
        const layouts = new Map();
        for (const d of days) {
            const list = initialTasks
                .filter(t => overlapsDay(t, d) && !isAllDayOnDay(t, d))
                .sort((a, b) => a.start - b.start || a.end - b.end);
            const lanes = [];
            const assignments = new Map();
            for (const t of list) {
                let laneIndex = 0;
                while (true) {
                    const lane = lanes[laneIndex] || [];
                    // Check overlap with last task in this lane
                    const last = lane[lane.length - 1];
                    if (!last || last.end <= t.start) {
                        lane.push(t);
                        lanes[laneIndex] = lane;
                        assignments.set(t.id, laneIndex);
                        break;
                    }
                    laneIndex += 1;
                }
            }
            layouts.set(formatDateKey(d), { lanesCount: Math.max(1, lanes.length), laneOf: assignments });
        }
        return layouts;
    }, [days]);

    const selectedDayTasks = useMemo(() => {
        return initialTasks.filter(t => overlapsDay(t, selectedDate));
    }, [selectedDate]);

    function goPrevWeek() {
        setAnchorDate(addDays(anchorDate, -7));
    }
    function goNextWeek() {
        setAnchorDate(addDays(anchorDate, 7));
    }

    function renderTaskBlock(task, day) {
        if (!overlapsDay(task, day)) return null;
        if (isAllDayOnDay(task, day)) return null; // all-day shown in pills row
        const { start: visStart, end: visEnd } = visibleHoursWindow(day);
        const blockStart = new Date(Math.max(task.start.getTime(), visStart.getTime()));
        const blockEnd = new Date(Math.min(task.end.getTime(), visEnd.getTime()));
        if (blockEnd <= blockStart) return null;
        const totalMin = (HOURS_END - HOURS_START) * 60;
        const startMin = (blockStart.getHours() - HOURS_START) * 60 + blockStart.getMinutes();
        const endMin = (blockEnd.getHours() - HOURS_START) * 60 + blockEnd.getMinutes();
        const topPct = (startMin / totalMin) * 100;
        const heightPct = Math.max(6, ((endMin - startMin) / totalMin) * 100);
        const layout = dayLayouts.get(formatDateKey(day));
        const laneIndex = layout?.laneOf.get(task.id) ?? 0;
        const lanesCount = layout?.lanesCount ?? 1;
        const gapPx = 4;
        const widthPct = 100 / lanesCount;
        const leftPct = laneIndex * widthPct;
        const { bg, border, text } = getStatusClasses(task.status);
        return (
            <div
                key={task.id}
                className={`absolute rounded px-2 py-1 text-xs shadow-sm ${bg} ${border} ${text} border`}
                style={{ top: `${topPct}%`, height: `${heightPct}%`, left: `calc(${leftPct}% + ${gapPx}px)`, width: `calc(${widthPct}% - ${gapPx * 2}px)` }}
                title={`${task.title} (${task.assignee})`}
            >
                <div className="font-medium truncate">{task.title}</div>
                <div className="text-[10px] text-blue-600 truncate">
                    {blockStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {" - "}
                    {blockEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader breadcrumbs={[{ label: "Lịch", to: "/calendar" }]} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <Card className="lg:col-span-3">
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Thời khóa biểu theo tuần</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={goPrevWeek}>‹ Tuần trước</Button>
                            <Button onClick={goNextWeek}>Tuần sau ›</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full relative">
                            <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, minmax(0, 1fr))` }}>
                                <div />
                                {days.map((d) => (
                                    <button
                                        key={d.toISOString()}
                                        className={`flex h-12 items-center justify-center border-b text-sm ${formatDateKey(d) === formatDateKey(selectedDate) ? 'bg-blue-50 text-blue-700' : ''}`}
                                        onClick={() => setSelectedDate(d)}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium">{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-100">{d.getDate()}/{d.getMonth() + 1}</span>
                                        </div>
                                    </button>
                                ))}

                                {/* All-day lane */}
                                <div className="border-r py-2 pr-2 text-right text-xs text-gray-500 dark:text-gray-100">Cả ngày</div>
                                {days.map((d) => {
                                    const allDayTasks = initialTasks.filter(t => isAllDayOnDay(t, d));
                                    return (
                                        <div key={d.toISOString() + '-allday'} className="min-h-[44px] border-b border-l p-1">
                                            <div className="flex flex-col gap-1">
                                                {allDayTasks.map(t => {
                                                    const { bg, border, text } = getStatusClasses(t.status);
                                                    const continuesPrev = t.start < dayWindow(d).start;
                                                    const continuesNext = t.end > dayWindow(d).end;
                                                    return (
                                                        <div key={t.id} className={`inline-flex w-full items-center gap-1 rounded px-2 py-1 text-xs ${bg} ${border} ${text} border`}>
                                                            <span className="truncate">{t.title}</span>
                                                            <span className="ml-auto whitespace-nowrap text-[10px] text-gray-500 ">
                                                                {continuesPrev ? '← ' : ''}
                                                                {t.start.toDateString() === t.end.toDateString() ? t.start.toLocaleDateString('vi-VN') : ''}
                                                                {continuesNext ? ' →' : ''}
                                                            </span>
                                                        </div>
                                                    );
                                                })}

                                            </div>
                                        </div>
                                    );
                                })}

                                {hours.map((h, idx) => (
                                    <React.Fragment key={h}>
                                        <div className="relative border-r py-6 text-right text-xs text-gray-500 dark:text-gray-100">
                                            <div className="sticky top-6 pr-2">{String(h).padStart(2, '0')}:00</div>
                                        </div>
                                        {days.map((d) => (
                                            <div key={d.toISOString() + h} className={`relative h-16 border-b ${idx === 0 ? 'border-t-0' : ''} border-l`}></div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Absolute overlay aligned with the hour grid (below headers + all-day) */}
                            <div className="absolute left-0 right-0" style={{ top: 12 * 4 + 44, pointerEvents: 'none' }}>
                                <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, minmax(0, 1fr))` }}>
                                    <div />
                                    {days.map((d) => (
                                        <div key={d.toISOString() + '-tasks'} className="relative" style={{ height: (HOURS_END - HOURS_START) * 64 }}>
                                            {initialTasks.filter(t => overlapsDay(t, d)).map(t => renderTaskBlock(t, d))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-fit min-h-[32rem]">
                    <CardHeader>
                        <CardTitle>Công việc ngày {selectedDate.toLocaleDateString('vi-VN')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                            {selectedDayTasks.length === 0 && (
                                <div className="text-sm text-gray-500">Không có công việc</div>
                            )}
                            {selectedDayTasks.map(t => (
                                <div key={t.id} className="rounded border p-2">
                                    <div className="text-sm font-medium">{t.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-100">
                                        {t.start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        {" - "}
                                        {t.end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-100">{t.assignee}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

    );
}


