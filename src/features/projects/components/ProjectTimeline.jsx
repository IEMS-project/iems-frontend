import React, { useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import IssueDetailModal from "@/features/projects/components/IssueDetailModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
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
import { EyeIcon } from "lucide-react";
import { differenceInDays, differenceInMonths, startOfDay, startOfMonth, getDaysInMonth, getDate } from "date-fns";

export default function ProjectTimeline({
    issues = [],
    sprints = [],
    workflowStatuses = [],
    members = [],
    loading = false,
}) {
    const { t } = useTranslation();
    const [range, setRange] = useState("monthly");
    const [zoom] = useState(100);
    const ganttContainerRef = useRef(null);
    const [filters, setFilters] = useState({ assignee: "", status: "" });
    const [selectedIssue, setSelectedIssue] = useState(null);

    // Build lookup maps
    const statusMap = useMemo(() => {
        const map = {};
        workflowStatuses.forEach(s => { map[s.id] = s; });
        return map;
    }, [workflowStatuses]);

    const memberMap = useMemo(() => {
        const map = {};
        members.forEach(m => { map[m.userId] = m; });
        return map;
    }, [members]);

    // Filter issues
    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            if (filters.assignee && issue.assigneeId !== filters.assignee) return false;
            if (filters.status && issue.statusId !== filters.status) return false;
            return true;
        });
    }, [issues, filters]);

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

    const handleViewIssue = (issueId) => {
        const issue = issues.find(i => i.id === issueId);
        if (issue) setSelectedIssue(issue);
    };

    const scrollToToday = useCallback(() => {
        const ganttElement = ganttContainerRef.current?.querySelector(".gantt");
        if (!ganttElement) return;

        setTimeout(() => {
            const today = new Date();
            const timelineStartDate = new Date(today.getFullYear() - 1, 0, 1);
            const columnWidth = range === "daily" ? 50 : range === "quarterly" ? 100 : 150;
            const parsedColumnWidth = (columnWidth * zoom) / 100;

            let fullColumns = 0;
            let innerOffset = 0;

            if (range === "daily") {
                fullColumns = differenceInDays(startOfDay(today), startOfDay(timelineStartDate));
            } else {
                fullColumns = differenceInMonths(startOfMonth(today), startOfMonth(timelineStartDate));
                const totalDaysInMonth = getDaysInMonth(today);
                innerOffset = (getDate(today) / totalDaysInMonth) * parsedColumnWidth;
            }

            const totalOffset = fullColumns * parsedColumnWidth + innerOffset;
            const visibleWidth = ganttElement.clientWidth - 300;
            ganttElement.scrollTo({ left: Math.max(0, totalOffset - visibleWidth / 2), behavior: "smooth" });
        }, 100);
    }, [range, zoom]);

    const hasActiveFilters = filters.assignee || filters.status;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle>{t("projects.detail.timeline.title")}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select
                            value={filters.assignee}
                            onChange={(e) => setFilters(f => ({ ...f, assignee: e.target.value }))}
                            className="w-auto min-w-[150px]"
                        >
                            <option value="">{t("projects.detail.timeline.filters.assignee")}</option>
                            {members.map(m => (
                                <option key={m.userId} value={m.userId}>{m.userName}</option>
                            ))}
                        </Select>
                        <Select
                            value={filters.status}
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                            className="w-auto min-w-[130px]"
                        >
                            <option value="">{t("projects.detail.timeline.filters.status")}</option>
                            {workflowStatuses.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </Select>
                        {hasActiveFilters && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setFilters({ assignee: "", status: "" })}
                            >
                                {t("projects.detail.timeline.actions.clearFilters")}
                            </Button>
                        )}
                        <div className="ml-2 flex items-center gap-2 border-l pl-2">
                            {["daily", "monthly", "quarterly"].map(r => (
                                <Button
                                    key={r}
                                    variant={range === r ? "primary" : "secondary"}
                                    onClick={() => setRange(r)}
                                >
                                    {t(`projects.detail.timeline.range.${r}`)}
                                </Button>
                            ))}
                            <Button variant="secondary" onClick={scrollToToday}>
                                {t("projects.detail.timeline.actions.scrollToToday")}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {loading ? (
                    <div className="space-y-4 p-6">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="grid" style={{ gridTemplateColumns: "240px 1fr" }}>
                                <div className="sticky left-0 bg-background border-b py-3 px-3">
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <div className="relative border-b py-3">
                                    <Skeleton className="h-8 w-1/2 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : totalFeatureCount === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground p-6">
                        {t("projects.detail.timeline.noTasks")}
                    </div>
                ) : (
                    <div
                        className="h-[calc(100vh-280px)] max-h-[800px] min-h-[475px] w-full overflow-hidden"
                        ref={ganttContainerRef}
                    >
                        <GanttProvider
                            className="border rounded-md h-full"
                            range={range}
                            zoom={zoom}
                        >
                            <GanttSidebar>
                                {groups.map(group => (
                                    <GanttSidebarGroup key={group.id} name={group.name}>
                                        {group.issues.map(issue => {
                                            const feature = issueToFeature(issue, group);
                                            return (
                                                <GanttSidebarItem
                                                    key={feature.id}
                                                    feature={feature}
                                                    onSelectItem={undefined}
                                                />
                                            );
                                        })}
                                    </GanttSidebarGroup>
                                ))}
                            </GanttSidebar>

                            <GanttTimeline>
                                <GanttHeader />
                                <GanttFeatureList>
                                    {groups.map(group => (
                                        <GanttFeatureListGroup key={group.id}>
                                            {group.issues.map(issue => {
                                                const feature = issueToFeature(issue, group);
                                                const member = memberMap[issue.assigneeId];

                                                return (
                                                    <div className="flex" key={feature.id}>
                                                        <ContextMenu>
                                                            <ContextMenuTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className="w-full"
                                                                    onClick={() => handleViewIssue(issue.id)}
                                                                >
                                                                    <GanttFeatureItem onMove={() => {}} {...feature}>
                                                                        <p className="flex-1 truncate text-xs">
                                                                            {feature.name}
                                                                        </p>
                                                                        {member && (
                                                                            <Avatar
                                                                                name={member.userName}
                                                                                className="h-4 w-4 shrink-0 text-[8px]"
                                                                            />
                                                                        )}
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

            <IssueDetailModal
                open={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
                issue={selectedIssue}
                onUpdate={() => setSelectedIssue(null)}
            />
        </Card>
    );
}
