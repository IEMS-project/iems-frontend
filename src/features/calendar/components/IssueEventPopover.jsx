import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ExternalLink, Calendar, User, Flag, Layers } from "lucide-react";

const PRIORITY_LABEL = { HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp", HIGHEST: "Cao nhất", LOWEST: "Thấp nhất" };
const PRIORITY_COLOR = {
    HIGH: "text-red-500", HIGHEST: "text-red-600",
    MEDIUM: "text-amber-500",
    LOW: "text-green-500", LOWEST: "text-green-400",
};

export default function IssueEventPopover({ event, position, onClose }) {
    const navigate = useNavigate();
    const ref = useRef(null);

    const props = event?.extendedProps || {};
    const title = event?.title || "Untitled";
    const projectId = props.projectId;
    const issueId = event?.id;

    // Close on click outside
    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    // Adjust position so popover stays in viewport
    const style = {
        position: "fixed",
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y, window.innerHeight - 280),
        zIndex: 9999,
    };

    function handleOpen() {
        if (projectId && issueId) {
            navigate(`/projects/${projectId}/backlog`);
        }
        onClose();
    }

    return (
        <div
            ref={ref}
            style={style}
            className="w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                    {title}
                </p>
                <button
                    onClick={onClose}
                    className="mt-0.5 shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Body */}
            <div className="space-y-2.5 px-4 py-3 text-sm">
                {props.projectName && (
                    <Row icon={Layers} label="Project" value={props.projectName} />
                )}
                {props.assignedToName && (
                    <Row icon={User} label="Assignee" value={props.assignedToName} />
                )}
                {props.priority && (
                    <div className="flex items-center gap-2.5">
                        <Flag className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-wide text-gray-400">Priority</span>
                        <span className={`font-semibold ${PRIORITY_COLOR[props.priority] || "text-gray-600"}`}>
                            {PRIORITY_LABEL[props.priority] || props.priority}
                        </span>
                    </div>
                )}
                {event?.start && (
                    <Row
                        icon={Calendar}
                        label="Due date"
                        value={new Date(event.end || event.start).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    />
                )}
                {props.status && (
                    <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-indigo-400" />
                        </span>
                        <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-wide text-gray-400">Status</span>
                        <span className="text-gray-700 dark:text-gray-300">{props.status}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            {projectId && (
                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                    <button
                        onClick={handleOpen}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Xem task
                    </button>
                </div>
            )}
        </div>
    );
}

function Row({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-2.5">
            <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
            <span className="truncate text-gray-700 dark:text-gray-300">{value}</span>
        </div>
    );
}
