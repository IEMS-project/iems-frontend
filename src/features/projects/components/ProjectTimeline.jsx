import React, { useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import IssueDetailModal from "@/features/projects/components/IssueDetailModal";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import IssueFiltersDropdown from "./shared/IssueFiltersDropdown";
import { getIssueTypeColor, getIssueTypeIcon, getPriorityIcon } from "./IssueCard";
import { cn } from "@/lib/utils";
import {
    GanttProvider,
    GanttSidebar,
    GanttSidebarGroup,
    GanttSidebarItem,
    GanttTimeline,
    GanttHeader,
    GanttFeatureList,
    GanttFeatureListGroup,
    GanttFeatureItem,
    GanttToday,
} from "@/components/ui/shadcn-io/gantt";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { CalendarDays, EyeIcon, FilterX, SlidersHorizontal, User } from "lucide-react";
import { differenceInDays, differenceInMonths, differenceInWeeks, startOfDay, startOfMonth, startOfWeek, getDaysInMonth, getDate } from "date-fns";

export default function ProjectTimeline({
    issues = [],
    sprints = [],
    workflowStatuses = [],
    issueTypes = [],
    issuePriorities = [],
    members = [],
    loading = false,
}) {
    const { t } = useTranslation();
    const [range, setRange] = useState("monthly");
    const zoom = 100;
    const ganttContainerRef = useRef(null);
    const [filters, setFilters] = useState({ assignee: "", status: "", type: "", priority: "" });
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const filterBtnRef = useRef(null);

    const resolveMemberId = useCallback((member) => (
        member?.accountId ||
        member?.userId ||
        member?.user?.accountId ||
        member?.user?.id ||
        member?.id
    ), []);

    const resolveIssueAssigneeId = useCallback((issue) => (
        issue?.assigneeId ||
        issue?.assignee?.accountId ||
        issue?.assignee?.userId ||
        issue?.assignee?.user?.accountId ||
        issue?.assignee?.user?.id ||
        issue?.assignee?.id
    ), []);

    // Build lookup maps
    const statusMap = useMemo(() => {
        const map = {};
        workflowStatuses.forEach(s => { map[s.id] = s; });
        return map;
    }, [workflowStatuses]);

    const memberMap = useMemo(() => {
        const map = {};
        members.forEach(m => {
            const id = resolveMemberId(m);
            if (id) map[id] = m;
        });
        return map;
    }, [members, resolveMemberId]);

    const typeMap = useMemo(() => {
        const map = {};
        issueTypes.forEach((type) => {
            map[type.id] = type;
        });
        return map;
    }, [issueTypes]);

    const priorityMap = useMemo(() => {
        const map = {};
        issuePriorities.forEach((priority) => {
            map[priority.id] = priority;
        });
        return map;
    }, [issuePriorities]);

    // Filter issues
    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            const issueAssigneeId = String(resolveIssueAssigneeId(issue) || "");
            if (filters.assignee && issueAssigneeId !== String(filters.assignee)) return false;
            if (filters.status && issue.statusId !== filters.status) return false;
            if (filters.type && String(issue.issueTypeId || "") !== String(filters.type)) return false;
            if (filters.priority && String(issue.priorityId || "") !== String(filters.priority)) return false;
            return true;
        });
    }, [issues, filters, resolveIssueAssigneeId]);

    // Group issues by sprint, with a Backlog group for unassigned issues
    const groups = useMemo(() => {
        const result = sprints.map(sprint => ({
            id: sprint.id,
            name: sprint.name,
            startDate: sprint.startDate ? new Date(sprint.startDate) : null,
            endDate: sprint.endDate ? new Date(sprint.endDate) : null,
            issues: filteredIssues.filter(i => i.sprintId === sprint.id),
        })).filter(g => g.issues.length > 0);

        const backlogIssues = filteredIssues.filter(i => !i.sprintId);
        if (backlogIssues.length > 0) {
            result.push({
                id: "backlog",
                name: "Backlog",
                startDate: null,
                endDate: null,
                issues: backlogIssues,
            });
        }

        return result;
    }, [sprints, filteredIssues]);

    // Convert an issue to a GanttFeature object
    const issueToFeature = useCallback((issue, group) => {
        const status = statusMap[issue.statusId];
        const fallbackStart = group.startDate || new Date(issue.createdAt || Date.now());
        const fallbackEnd = group.endDate || new Date(fallbackStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const startAt = fallbackStart;
        const endAt = issue.dueDate ? new Date(issue.dueDate) : fallbackEnd;

        return {
            id: issue.id,
            name: issue.title || issue.issueKey || "Issue",
            startAt: startAt > endAt ? endAt : startAt,
            endAt,
            status: status
                ? { id: status.id, name: status.name, color: status.color }
                : { id: "unknown", name: "Unknown", color: "#6B7280" },
        };
    }, [statusMap]);

    const totalFeatureCount = useMemo(
        () => groups.reduce((sum, g) => sum + g.issues.length, 0),
        [groups]
    );

    const statusLegend = useMemo(() => {
        const counts = new Map();
        filteredIssues.forEach((issue) => {
            const status = statusMap[issue.statusId];
            const key = status?.id || "unknown";
            const name = status?.name || t("projects.status.unknown", { defaultValue: "Unknown" });
            const color = status?.color || "#6B7280";
            counts.set(key, {
                id: key,
                name,
                color,
                count: (counts.get(key)?.count || 0) + 1,
            });
        });
        return Array.from(counts.values());
    }, [filteredIssues, statusMap, t]);

    const handleViewIssue = (issueId) => {
        const issue = issues.find(i => i.id === issueId);
        if (issue) setSelectedIssue(issue);
    };

    const scrollToTodayWithRange = useCallback((targetRange) => {
        const ganttElement = ganttContainerRef.current?.querySelector(".gantt");
        if (!ganttElement) return;

        setTimeout(() => {
            const today = new Date();
            const timelineStartDate = new Date(today.getFullYear(), 0, 1);
            const columnWidth = targetRange === "daily" ? 50 : targetRange === "weekly" ? 110 : targetRange === "quarterly" ? 100 : 150;
            const parsedColumnWidth = (columnWidth * zoom) / 100;

            let fullColumns = 0;
            let innerOffset = 0;

            if (targetRange === "daily") {
                fullColumns = differenceInDays(startOfDay(today), startOfDay(timelineStartDate));
            } else if (targetRange === "weekly") {
                fullColumns = differenceInWeeks(startOfWeek(today), startOfWeek(timelineStartDate));
                innerOffset = (differenceInDays(today, startOfWeek(today)) / 7) * parsedColumnWidth;
            } else {
                fullColumns = differenceInMonths(startOfMonth(today), startOfMonth(timelineStartDate));
                const totalDaysInMonth = getDaysInMonth(today);
                innerOffset = (getDate(today) / totalDaysInMonth) * parsedColumnWidth;
            }

            const totalOffset = fullColumns * parsedColumnWidth + innerOffset;
            const visibleWidth = ganttElement.clientWidth - 300;
            ganttElement.scrollTo({ left: Math.max(0, totalOffset - visibleWidth / 2), behavior: "smooth" });
        }, 100);
    }, [zoom]);

    const scrollToToday = useCallback(() => {
        scrollToTodayWithRange(range);
    }, [scrollToTodayWithRange, range]);

    const activeFilterCount = useMemo(
        () => [filters.assignee, filters.status, filters.type, filters.priority].filter(Boolean).length,
        [filters.assignee, filters.status, filters.type, filters.priority]
    );
    const hasActiveFilters = activeFilterCount > 0;
    const rangeOptions = ["daily", "weekly", "monthly", "quarterly"];

    return (
        <Card className="overflow-hidden border-border/70">
            <CardHeader className="space-y-4 border-b border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <CalendarDays size={16} />
                        </span>
                        <div>
                            <CardTitle className="text-base">{t("projects.detail.timeline.title")}</CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("projects.detail.timeline.subtitle", { defaultValue: "Visual timeline for sprint and backlog issues" })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="gray">{t("projects.detail.timeline.summary.groups", { defaultValue: "Groups" })}: {groups.length}</Badge>
                        <Badge variant="blue">{t("projects.detail.timeline.summary.issues", { defaultValue: "Issues" })}: {totalFeatureCount}</Badge>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            ref={filterBtnRef}
                            type="button"
                            onClick={() => setShowFilterDropdown((v) => !v)}
                            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {t("issues.filters.title", { defaultValue: "Filters" })}
                            <span className={cn(
                                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium",
                                activeFilterCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {activeFilterCount}
                            </span>
                        </button>
                        {showFilterDropdown && (
                            <IssueFiltersDropdown
                                anchorEl={filterBtnRef.current}
                                onClose={() => setShowFilterDropdown(false)}
                                onClear={() => setFilters({ assignee: "", status: "", type: "", priority: "" })}
                                workflowStatuses={workflowStatuses}
                                issueTypes={issueTypes}
                                issuePriorities={issuePriorities}
                                members={members}
                                filterStatus={filters.status}
                                setFilterStatus={(value) => setFilters((f) => ({ ...f, status: value || "" }))}
                                filterType={filters.type}
                                setFilterType={(value) => setFilters((f) => ({ ...f, type: value || "" }))}
                                filterPriority={filters.priority}
                                setFilterPriority={(value) => setFilters((f) => ({ ...f, priority: value || "" }))}
                                filterAssignee={filters.assignee}
                                setFilterAssignee={(value) => setFilters((f) => ({ ...f, assignee: value || "" }))}
                            />
                        )}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilters({ assignee: "", status: "", type: "", priority: "" })}
                            >
                                <FilterX size={14} />
                                {t("projects.detail.timeline.actions.clearFilters")}
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-md border border-input bg-muted/30 p-1">
                            {rangeOptions.map(r => (
                                <Button
                                    key={r}
                                    size="sm"
                                    variant={range === r ? "default" : "ghost"}
                                    onClick={() => {
                                        setRange(r);
                                        scrollToTodayWithRange(r);
                                    }}
                                    className="h-7 px-2"
                                >
                                    {t(`projects.detail.timeline.range.${r}`, { defaultValue: r === "weekly" ? "Week" : r })}
                                </Button>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={scrollToToday}>
                            {t("projects.detail.timeline.actions.scrollToToday")}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="grid grid-cols-[300px_1fr] overflow-hidden rounded-lg border border-border/60 bg-background">
                                <div className="sticky left-0 border-b bg-background px-3 py-3">
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <div className="relative border-b px-3 py-3">
                                    <Skeleton className="h-8 w-1/2 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : totalFeatureCount === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-10 text-center text-sm text-muted-foreground">
                        {t("projects.detail.timeline.noTasks")}
                    </div>
                ) : (
                    <div
                        className="h-[calc(100vh-330px)] max-h-[760px] min-h-[460px] w-full overflow-hidden rounded-xl border border-border/70 bg-background"
                        ref={ganttContainerRef}
                    >
                        <GanttProvider
                            className="h-full rounded-xl border-0 bg-muted/20"
                            range={range}
                            zoom={zoom}
                        >
                            <GanttSidebar className="w-[300px] border-border/70 bg-background/95">
                                {groups.map(group => (
                                    <GanttSidebarGroup
                                        key={group.id}
                                        name={group.name}
                                        className="rounded-md border border-border/40 bg-background"
                                    >
                                        {group.issues.map(issue => {
                                            const feature = issueToFeature(issue, group);
                                            return (
                                                <GanttSidebarItem
                                                    key={feature.id}
                                                    feature={feature}
                                                    className="hover:bg-muted/60"
                                                    onSelectItem={undefined}
                                                />
                                            );
                                        })}
                                    </GanttSidebarGroup>
                                ))}
                            </GanttSidebar>

                            <GanttTimeline className="bg-background/50">
                                <GanttHeader className="border-b border-border/70" />
                                <GanttFeatureList>
                                    {groups.map(group => (
                                        <GanttFeatureListGroup key={group.id} className="rounded-md">
                                            {group.issues.map(issue => {
                                                const feature = issueToFeature(issue, group);
                                                const assigneeId = resolveIssueAssigneeId(issue);
                                                const member = memberMap[assigneeId] || issue.assignee;
                                                const assigneeName = member?.userName || member?.name || member?.fullName || member?.email;
                                                const type = typeMap[issue.issueTypeId];
                                                const priority = priorityMap[issue.priorityId];
                                                const TypeIcon = getIssueTypeIcon(type?.name);
                                                const typeColor = getIssueTypeColor(type?.name);
                                                const { icon: PriorityIcon, color: priorityColor } = getPriorityIcon(priority?.name);

                                                return (
                                                    <div className="flex" key={feature.id}>
                                                        <ContextMenu>
                                                            <ContextMenuTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className="w-full text-left"
                                                                    onClick={() => handleViewIssue(issue.id)}
                                                                >
                                                                    <GanttFeatureItem onMove={() => { }} {...feature} className="hover:opacity-95">
                                                                        <div className="flex w-full items-center gap-2">
                                                                            <span
                                                                                className="h-2 w-2 shrink-0 rounded-full"
                                                                                style={{ backgroundColor: feature.status.color }}
                                                                            />
                                                                            <TypeIcon className={cn("h-3.5 w-3.5 shrink-0", typeColor)} />
                                                                            <p className="flex-1 truncate text-xs font-medium">
                                                                                {feature.name}
                                                                            </p>
                                                                            <PriorityIcon className={cn("h-3.5 w-3.5 shrink-0", priorityColor)} />
                                                                            {member && (
                                                                                <Avatar
                                                                                    user={member}
                                                                                    name={assigneeName}
                                                                                    className="h-5 w-5 shrink-0 text-[9px]"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </GanttFeatureItem>
                                                                </button>
                                                            </ContextMenuTrigger>
                                                            <ContextMenuContent>
                                                                <ContextMenuItem
                                                                    className="flex items-center gap-2"
                                                                    onClick={() => handleViewIssue(issue.id)}
                                                                >
                                                                    <EyeIcon className="text-muted-foreground" size={16} />
                                                                    {t("projects.actions.view")}
                                                                </ContextMenuItem>
                                                            </ContextMenuContent>
                                                        </ContextMenu>
                                                    </div>
                                                );
                                            })}
                                        </GanttFeatureListGroup>
                                    ))}
                                </GanttFeatureList>
                                <GanttToday />
                            </GanttTimeline>
                        </GanttProvider>
                    </div>
                )}
            </CardContent>

            {!loading && totalFeatureCount > 0 && (
                <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/10 px-4 py-3">
                    <div className="text-xs font-medium text-muted-foreground">
                        {t("projects.detail.timeline.legend", { defaultValue: "Legend" })}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {statusLegend.map((item) => (
                            <span
                                key={item.id}
                                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-1 text-xs"
                            >
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name} ({item.count})
                            </span>
                        ))}
                    </div>
                </CardFooter>
            )}

            <IssueDetailModal
                open={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
                issue={selectedIssue}
                onUpdate={() => setSelectedIssue(null)}
            />
        </Card>
    );
}
