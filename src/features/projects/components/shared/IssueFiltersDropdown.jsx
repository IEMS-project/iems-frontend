import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "../IssueCard";
import { getStatusStyle } from "../../utils/issueStyles";

const resolveMemberId = (member) =>
    member?.accountId ||
    member?.userId ||
    member?.user?.accountId ||
    member?.user?.id ||
    member?.id;

function Picker({ id, label, value, valueIcon, selectedValue, options, openPicker, setOpenPicker, onChange }) {
    return (
        <div className="space-y-1 relative">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <button
                type="button"
                onClick={() => setOpenPicker((prev) => (prev === id ? null : id))}
                className="w-full rounded-md border border-border bg-background text-foreground px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-muted transition-colors"
            >
                {valueIcon ? <span className="shrink-0">{valueIcon}</span> : null}
                <span className="truncate flex-1 text-left">{value}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {openPicker === id && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-lg py-1 max-h-56 overflow-auto">
                    {options.map((opt) => (
                        <button
                            key={String(opt.value)}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(opt.value);
                                setOpenPicker(null);
                            }}
                            className="w-full px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-muted text-left"
                        >
                            {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
                            {opt.label ? <span className="truncate flex-1">{opt.label}</span> : <span className="flex-1" />}
                            {String(opt.value) === String(selectedValue || "") && (
                                <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function IssueFiltersDropdown({
    anchorEl,
    onClose,
    onClear,
    workflowStatuses = [],
    issueTypes = [],
    issuePriorities = [],
    members = [],
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    filterSprint,
    setFilterSprint,
    sprints = [],
    includeBacklogSprintOption = false,
}) {
    const [openPicker, setOpenPicker] = useState(null);

    const rect = anchorEl?.getBoundingClientRect();
    if (!rect) return null;

    const statusLabel = workflowStatuses.find((s) => s.id === filterStatus)?.name || "All";
    const typeLabel = issueTypes.find((tp) => tp.id === filterType)?.name || "All";
    const priorityLabel = issuePriorities.find((p) => p.id === filterPriority)?.name || "All";

    const assigneeObj = members.find((m) => String(resolveMemberId(m) || "") === String(filterAssignee || ""));
    const assigneeLabel = assigneeObj
        ? (assigneeObj.fullName || assigneeObj.userName || assigneeObj.name || assigneeObj.email)
        : "All";
    const assigneeValueIcon = assigneeObj
        ? <Avatar user={assigneeObj} name={assigneeLabel} size="xs" />
        : <User className="w-3.5 h-3.5 text-muted-foreground" />;

    const hasSprintPicker = typeof setFilterSprint === "function";
    const sprintLabel = !filterSprint
        ? "All"
        : filterSprint === "__backlog__"
            ? "Backlog"
            : (sprints.find((s) => s.id === filterSprint)?.name || "All");

    const statusOptions = [
        { value: "", label: "All" },
        ...workflowStatuses.map((s) => ({
            value: s.id,
            label: "",
            icon: <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusStyle(s.name)}`}>{s.name}</span>,
        })),
    ];

    const typeOptions = [
        { value: "", label: "All" },
        ...issueTypes.map((tp) => {
            const TypeIcon = getIssueTypeIcon(tp?.name);
            const typeColor = getIssueTypeColor(tp?.name);
            return {
                value: tp.id,
                label: tp.name,
                icon: <TypeIcon className={cn("w-3.5 h-3.5", typeColor)} />,
            };
        }),
    ];

    const priorityOptions = [
        { value: "", label: "All" },
        ...issuePriorities.map((p) => {
            const { icon: PrioIcon, color } = getPriorityIcon(p?.name);
            return {
                value: p.id,
                label: p.name,
                icon: <PrioIcon className={cn("w-3.5 h-3.5", color)} />,
            };
        }),
    ];

    const assigneeOptions = [
        { value: "", label: "All", icon: <User className="w-3.5 h-3.5 text-muted-foreground" /> },
        ...members
            .map((m) => {
                const id = resolveMemberId(m);
                if (!id) return null;
                const name = m.fullName || m.userName || m.name || m.email || String(id);
                return {
                    value: id,
                    label: name,
                    icon: <Avatar user={m} name={name} size="xs" />,
                };
            })
            .filter(Boolean),
    ];

    const sprintOptions = hasSprintPicker
        ? [
            { value: "", label: "All" },
            ...(includeBacklogSprintOption ? [{ value: "__backlog__", label: "Backlog" }] : []),
            ...sprints.map((s) => ({ value: s.id, label: s.name })),
        ]
        : [];

    return createPortal(
        <div
            style={{ position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 9999, width: 340 }}
            className="rounded-md border border-border bg-popover shadow-xl p-3 space-y-3"
        >
            <div className="grid grid-cols-2 gap-2">
                <Picker
                    id="status"
                    label="Status"
                    value={statusLabel}
                    selectedValue={filterStatus}
                    options={statusOptions}
                    openPicker={openPicker}
                    setOpenPicker={setOpenPicker}
                    onChange={setFilterStatus}
                />

                <Picker
                    id="type"
                    label="Type"
                    value={typeLabel}
                    selectedValue={filterType}
                    options={typeOptions}
                    openPicker={openPicker}
                    setOpenPicker={setOpenPicker}
                    onChange={setFilterType}
                />

                <Picker
                    id="priority"
                    label="Priority"
                    value={priorityLabel}
                    selectedValue={filterPriority}
                    options={priorityOptions}
                    openPicker={openPicker}
                    setOpenPicker={setOpenPicker}
                    onChange={setFilterPriority}
                />

                {hasSprintPicker && (
                    <Picker
                        id="sprint"
                        label="Sprint"
                        value={sprintLabel}
                        selectedValue={filterSprint}
                        options={sprintOptions}
                        openPicker={openPicker}
                        setOpenPicker={setOpenPicker}
                        onChange={setFilterSprint}
                    />
                )}
            </div>

            <Picker
                id="assignee"
                label="Assignee"
                value={assigneeLabel || "All"}
                valueIcon={assigneeValueIcon}
                selectedValue={filterAssignee}
                options={assigneeOptions}
                openPicker={openPicker}
                setOpenPicker={setOpenPicker}
                onChange={setFilterAssignee}
            />

            <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                <button
                    type="button"
                    onClick={onClear}
                    className="px-2.5 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    Clear all
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                >
                    Done
                </button>
            </div>
        </div>,
        document.body
    );
}
