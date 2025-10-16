import React, { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/common/PageHeader";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useSearchParams } from "react-router-dom";
import { taskService } from "../services/taskService";

const initialEvents = [
    { id: "1", title: "Quarterly Budget Review", start: "2025-09-05", backgroundColor: "#fde68a", borderColor: "#f59e0b" },
    { id: "2", title: "Project Deadline", start: "2025-09-09T13:00:00", end: "2025-09-09T14:00:00", backgroundColor: "#fde68a", borderColor: "#f59e0b" },
    { id: "3", title: "Team Meeting", start: "2025-09-18T10:00:00", end: "2025-09-18T11:00:00", backgroundColor: "#bfdbfe", borderColor: "#60a5fa" },
    { id: "4", title: "Lunch with Client", start: "2025-09-19T12:00:00", end: "2025-09-19T13:15:00", backgroundColor: "#bbf7d0", borderColor: "#34d399" },
    { id: "5", title: "Product Launch", start: "2025-09-21", end: "2025-09-24", allDay: true, backgroundColor: "#e9d5ff", borderColor: "#c084fc" },
    { id: "6", title: "Sales Conference", start: "2025-09-22T14:30:00", end: "2025-09-22T14:45:00", backgroundColor: "#fecaca", borderColor: "#f87171" },
    { id: "7", title: "Team Meeting", start: "2025-09-23T09:00:00", end: "2025-09-23T10:00:00", backgroundColor: "#bfdbfe", borderColor: "#60a5fa" },
    { id: "8", title: "Marketing Strategy", start: "2025-09-27T10:00:00", end: "2025-09-27T11:30:00", backgroundColor: "#bbf7d0", borderColor: "#34d399" }
];

export default function CalendarPage() {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState("");
    const [activeView, setActiveView] = useState("dayGridMonth");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [searchParams] = useSearchParams();

    useEffect(() => {
        async function loadTasks() {
            setIsLoading(true);
            setErrorMessage("");
            try {
                const projectId = searchParams.get("projectId");
                const res = projectId
                    ? await taskService.getTasksByProject(projectId)
                    : await taskService.getMyTasks();
                const tasks = res?.data?.data || res?.data || res || [];

                function addOneDay(dateStr) {
                    if (!dateStr) return undefined;
                    const d = new Date(dateStr);
                    d.setDate(d.getDate() + 1);
                    return d.toISOString().slice(0, 10);
                }

                const mapped = (Array.isArray(tasks) ? tasks : []).map((t) => {
                    const start = t?.startDate || t?.createdAt?.slice(0, 10);
                    const endInclusive = t?.dueDate || t?.updatedAt?.slice(0, 10) || t?.startDate;
                    return {
                        id: t.id,
                        title: `${t.title}${t.projectName ? " (" + t.projectName + ")" : ""}`,
                        start: start,
                        end: addOneDay(endInclusive),
                        allDay: true,
                        extendedProps: {
                            status: t.status,
                            priority: t.priority,
                            projectId: t.projectId,
                            projectName: t.projectName,
                            assignedToName: t.assignedToName
                        }
                    };
                });

                setEvents(mapped);
            } catch (e) {
                setErrorMessage("Không tải được danh sách công việc");
            } finally {
                setIsLoading(false);
            }
        }
        loadTasks();
    }, [searchParams]);

    function handleDateSelect(selectionInfo) {
        const title = prompt("Tiêu đề sự kiện?");
        const calendarApi = selectionInfo.view.calendar;
        calendarApi.unselect();
        if (title) {
            const newEvent = {
                id: String(Date.now()),
                title,
                start: selectionInfo.startStr,
                end: selectionInfo.endStr,
                allDay: selectionInfo.allDay
            };
            setEvents(prev => [...prev, newEvent]);
        }
    }

    function handleEventClick(clickInfo) {
        if (confirm(`Xóa sự kiện "${clickInfo.event.title}"?`)) {
            setEvents(prev => prev.filter(e => e.id !== clickInfo.event.id));
        }
    }

    function handleAddQuickEvent() {
        const api = calendarRef.current?.getApi();
        const dateStr = api?.getDate()?.toISOString().slice(0, 10);
        const newEvent = { id: String(Date.now()), title: "New event", start: dateStr, allDay: true };
        setEvents(prev => [...prev, newEvent]);
    }

    function handlePrev() {
        const api = calendarRef.current?.getApi();
        api?.prev();
        setTitle(api?.view?.title || "");
    }

    function handleNext() {
        const api = calendarRef.current?.getApi();
        api?.next();
        setTitle(api?.view?.title || "");
    }

    function handleToday() {
        const api = calendarRef.current?.getApi();
        api?.today();
        setTitle(api?.view?.title || "");
    }

    function changeView(viewName) {
        const api = calendarRef.current?.getApi();
        api?.changeView(viewName);
        setActiveView(viewName);
        setTitle(api?.view?.title || "");
    }

    function getIsDarkMode() {
        if (typeof window === "undefined") return false;
        const hasDarkClass = document.documentElement.classList.contains("dark");
        if (hasDarkClass) return true;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function hueFromString(str) {
        if (!str) return 210; // default blue hue
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % 360;
    }

    function computeEventColors(projectId, priority) {
        const isDark = getIsDarkMode();
        const hue = hueFromString(projectId || "default");
        const lightnessBase = isDark ? 22 : 85; // background lightness
        const borderLightness = isDark ? 40 : 60;
        const satBase = isDark ? 60 : 70;
        const priorityDelta = priority === "High" ? (isDark ? 8 : -12) : priority === "Medium" ? 0 : (isDark ? -8 : 8);
        const bg = `hsl(${hue}, ${satBase}%, ${Math.max(5, Math.min(95, lightnessBase + priorityDelta))}%)`;
        const bd = `hsl(${hue}, ${satBase + 10}%, ${borderLightness}%)`;
        const text = isDark ? "#e5e7eb" : "#111827";
        return { backgroundColor: bg, borderColor: bd, textColor: text };
    }

    function onEventDidMount(arg) {
        const priority = arg.event.extendedProps?.priority;
        const projectId = arg.event.extendedProps?.projectId;
        const { backgroundColor, borderColor, textColor } = computeEventColors(projectId, priority);
        const el = arg.el;
        el.style.backgroundColor = backgroundColor;
        el.style.borderColor = borderColor;
        el.style.color = textColor;
    }

    const Legend = useMemo(() => (
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }}></span>High</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }}></span>Medium</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }}></span>Low</span>
        </div>
    ), []);

    return (
        <div className="space-y-6">
            <PageHeader breadcrumbs={[{ label: "Lịch", to: "/calendar" }]} />
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={handleToday}>Today</Button>
                            <div className="inline-flex rounded-md shadow-sm">
                                <button onClick={handlePrev} className="px-3 py-2 border border-gray-300 rounded-l-md text-sm hover:bg-gray-50 dark:border-gray-700">‹</button>
                                <button onClick={handleNext} className="px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm hover:bg-gray-50 dark:border-gray-700">›</button>
                            </div>
                        </div>
                        <CardTitle className="text-center md:text-left">{title || "Lịch làm việc"}</CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden dark:border-gray-700">
                                <button onClick={() => changeView("dayGridMonth")} className={`px-3 py-2 text-sm ${activeView === 'dayGridMonth' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Month</button>
                                <button onClick={() => changeView("timeGridWeek")} className={`px-3 py-2 text-sm ${activeView === 'timeGridWeek' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Week</button>
                                <button onClick={() => changeView("timeGridDay")} className={`px-3 py-2 text-sm ${activeView === 'timeGridDay' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Day</button>
                                <button onClick={() => changeView("listMonth")} className={`px-3 py-2 text-sm ${activeView === 'listMonth' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Agenda</button>
                            </div>
                            {Legend}
                            <Button onClick={handleAddQuickEvent}>+ New event</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="py-8 text-center text-sm text-gray-600 dark:text-gray-300">Đang tải công việc...</div>
                    )}
                    {!isLoading && errorMessage && (
                        <div className="py-8 text-center text-sm text-red-600">{errorMessage}</div>
                    )}
                    {!isLoading && !errorMessage && (
                        <div style={{ minHeight: 640 }}>
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={false}
                                locale="vi"
                                height="auto"
                                handleWindowResize={false}
                                slotMinTime="07:00:00"
                                slotMaxTime="21:00:00"
                                scrollTime="09:00:00"
                                businessHours={{ startTime: "07:00", endTime: "21:00" }}
                                selectable
                                selectMirror
                                dayMaxEventRows
                                events={events}
                                select={handleDateSelect}
                                eventClick={handleEventClick}
                                eventDidMount={onEventDidMount}
                                datesSet={(arg) => setTitle(arg.view.title)}
                                buttonText={{
                                    today: "Today",
                                    month: "Month",
                                    week: "Week",
                                    day: "Day",
                                    list: "Agenda"
                                }}
                                views={{
                                    timeGridWeek: { titleFormat: { year: "numeric", month: "long" } },
                                    listMonth: { listDayFormat: true }
                                }}
                                eventClassNames={() => "rounded-md border text-xs px-1"}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

