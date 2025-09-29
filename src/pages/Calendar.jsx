import React, { useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/common/PageHeader";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

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
    const [events, setEvents] = useState(initialEvents);
    const [title, setTitle] = useState("");
    const [activeView, setActiveView] = useState("dayGridMonth");

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

    return (
        <div className="space-y-6">
            <PageHeader breadcrumbs={[{ label: "Lịch", to: "/calendar" }]} />
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={handleToday}>Today</Button>
                            <div className="inline-flex rounded-md shadow-sm">
                                <button onClick={handlePrev} className="px-3 py-2 border border-gray-300 rounded-l-md text-sm hover:bg-gray-50">‹</button>
                                <button onClick={handleNext} className="px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm hover:bg-gray-50">›</button>
                            </div>
                                        </div>
                        <CardTitle className="text-center md:text-left">{title || "Lịch làm việc"}</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                                <button onClick={() => changeView("dayGridMonth")} className={`px-3 py-2 text-sm ${activeView === 'dayGridMonth' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>Month</button>
                                <button onClick={() => changeView("timeGridWeek")} className={`px-3 py-2 text-sm ${activeView === 'timeGridWeek' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>Week</button>
                                <button onClick={() => changeView("timeGridDay")} className={`px-3 py-2 text-sm ${activeView === 'timeGridDay' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>Day</button>
                                <button onClick={() => changeView("listMonth")} className={`px-3 py-2 text-sm ${activeView === 'listMonth' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>Agenda</button>
                            </div>
                            <Button onClick={handleAddQuickEvent}>+ New event</Button>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={false}
                        locale="vi"
                        height="auto"
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
                    </CardContent>
                </Card>
        </div>
    );
}

