import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useSearchParams, useNavigate } from "react-router-dom";
import { projectService } from "@/features/projects/api/projectService";
import { issueService } from "@/features/projects/api/issueService";
import { translatePriority } from "@/lib/i18n";
import IssueEventPopover from "@/features/calendar/components/IssueEventPopover";

export default function CalendarPage() {
    const calendarRef = useRef(null);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState("");
    const [activeView, setActiveView] = useState("dayGridMonth");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [searchParams] = useSearchParams();

    // Project filter
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("all");

    // Popover state
    const [popover, setPopover] = useState(null); // { event, position }

    // Load projects for filter
    useEffect(() => {
        projectService.getMyProjects()
            .then(data => setProjects(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const loadIssues = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const projectId = selectedProjectId !== "all" ? selectedProjectId : searchParams.get("projectId");
            let issues = [];

            if (projectId) {
                issues = await issueService.getIssues(projectId);
            } else {
                // Load all issues from all projects (up to 5)
                const projs = projects.slice(0, 5);
                const results = await Promise.allSettled(
                    projs.map(p => issueService.getIssues(p.id || p.projectId))
                );
                issues = results
                    .filter(r => r.status === "fulfilled")
                    .flatMap(r => {
                        const d = r.value;
                        return Array.isArray(d) ? d : (Array.isArray(d?.content) ? d.content : []);
                    });
            }

            function addOneDay(dateStr) {
                if (!dateStr) return undefined;
                const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
                const date = new Date(y, m - 1, d + 1);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            }

            const mapped = (Array.isArray(issues) ? issues : [])
                .filter(t => t.startDate || t.dueDate)
                .map(t => ({
                    id: t.id,
                    title: `${t.issueKey ? t.issueKey + " " : ""}${t.title || ""}`,
                    start: t.startDate?.slice(0, 10) || t.dueDate?.slice(0, 10),
                    end: addOneDay(t.dueDate?.slice(0, 10)),
                    allDay: true,
                    extendedProps: {
                        status: t.statusName || t.status,
                        priority: t.priority,
                        projectId: t.projectId,
                        projectName: t.projectName,
                        assignedToName: t.assigneeName || t.assignedToName,
                        issueKey: t.issueKey,
                    },
                }));

            setEvents(mapped);
        } catch (e) {
            setErrorMessage("Không tải được danh sách công việc");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId, searchParams, projects]);

    useEffect(() => {
        if (projects.length >= 0) loadIssues();
    }, [loadIssues]);

    function handleEventClick(clickInfo) {
        clickInfo.jsEvent.preventDefault();
        const rect = clickInfo.jsEvent.target.getBoundingClientRect();
        setPopover({
            event: clickInfo.event,
            position: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
        });
    }

    function hueFromString(str) {
        if (!str) return 210;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % 360;
    }

    function computeEventColors(projectId, priority) {
        const isDark = document.documentElement.classList.contains("dark");
        const hue = hueFromString(projectId || "default");
        const lightnessBase = isDark ? 22 : 85;
        const borderLightness = isDark ? 40 : 60;
        const satBase = isDark ? 60 : 70;
        const priorityLabel = translatePriority(priority);
        const priorityDelta = ["Cao", "Cao nhất"].includes(priorityLabel) ? (isDark ? 8 : -12) : (["Trung bình"].includes(priorityLabel) ? 0 : (isDark ? -8 : 8));
        const bg = `hsl(${hue}, ${satBase}%, ${Math.max(5, Math.min(95, lightnessBase + priorityDelta))}%)`;
        const bd = `hsl(${hue}, ${satBase + 10}%, ${borderLightness}%)`;
        const text = isDark ? "#e5e7eb" : "#111827";
        return { backgroundColor: bg, borderColor: bd, textColor: text };
    }

    function onEventDidMount(arg) {
        const { backgroundColor, borderColor, textColor } = computeEventColors(
            arg.event.extendedProps?.projectId,
            arg.event.extendedProps?.priority
        );
        arg.el.style.backgroundColor = backgroundColor;
        arg.el.style.borderColor = borderColor;
        arg.el.style.color = textColor;
    }

    function handlePrev() { const api = calendarRef.current?.getApi(); api?.prev(); setTitle(api?.view?.title || ""); }
    function handleNext() { const api = calendarRef.current?.getApi(); api?.next(); setTitle(api?.view?.title || ""); }
    function handleToday() { const api = calendarRef.current?.getApi(); api?.today(); setTitle(api?.view?.title || ""); }
    function changeView(viewName) {
        const api = calendarRef.current?.getApi();
        api?.changeView(viewName);
        setActiveView(viewName);
        setTitle(api?.view?.title || "");
    }

    return (
        <div className="space-y-6">
            {popover && (
                <IssueEventPopover
                    event={popover.event}
                    position={popover.position}
                    onClose={() => setPopover(null)}
                />
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Left controls */}
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={handleToday}>Hôm nay</Button>
                            <div className="inline-flex rounded-md shadow-sm">
                                <button onClick={handlePrev} className="px-3 py-2 border border-gray-300 rounded-l-md text-sm hover:bg-gray-50 dark:border-gray-700">‹</button>
                                <button onClick={handleNext} className="px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm hover:bg-gray-50 dark:border-gray-700">›</button>
                            </div>
                        </div>

                        <CardTitle className="text-center md:text-left">{title || "Lịch làm việc"}</CardTitle>

                        {/* Right controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Project filter */}
                            <select
                                value={selectedProjectId}
                                onChange={e => setSelectedProjectId(e.target.value)}
                                className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <option value="all">Tất cả projects</option>
                                {projects.map(p => (
                                    <option key={p.id || p.projectId} value={p.id || p.projectId}>
                                        {p.name || p.title}
                                    </option>
                                ))}
                            </select>

                            {/* View switcher */}
                            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden dark:border-gray-700">
                                {[["dayGridMonth", "Tháng"], ["timeGridWeek", "Tuần"], ["timeGridDay", "Ngày"], ["listMonth", "Danh sách"]].map(([view, label]) => (
                                    <button
                                        key={view}
                                        onClick={() => changeView(view)}
                                        className={`px-3 py-2 text-sm transition-colors ${activeView === view ? "bg-gray-900 text-white dark:bg-indigo-600" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {isLoading && <div className="py-8 text-center text-sm text-gray-500">Đang tải...</div>}
                    {!isLoading && errorMessage && <div className="py-8 text-center text-sm text-red-500">{errorMessage}</div>}
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
                                selectable
                                selectMirror
                                dayMaxEventRows
                                events={events}
                                eventClick={handleEventClick}
                                eventDidMount={onEventDidMount}
                                datesSet={(arg) => setTitle(arg.view.title)}
                                eventClassNames={() => "rounded-md border text-xs px-1 cursor-pointer"}
                                buttonText={{ today: "Hôm nay", month: "Tháng", week: "Tuần", day: "Ngày", list: "Danh sách" }}
                                views={{
                                    timeGridWeek: { titleFormat: { year: "numeric", month: "long" } },
                                    listMonth: { listDayFormat: true }
                                }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
