import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlarmClock, CalendarDays, CheckCircle2, ClipboardList, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Calendar from "@/components/ui/Calendar";
import DonutChart, { buildDonutSlices } from "@/components/ui/DonutChart";
import Progress from "@/components/ui/Progress";
import Skeleton from "@/components/ui/Skeleton";
import { projectService } from "@/features/projects/api/projectService";
import ActivityLogItem from "@/features/projects/components/ActivityLogItem";
import { useProject } from "@/features/projects/context/ProjectContext";

function formatDate(dateString) {
    if (!dateString) return "-";
    const [y, m, d] = dateString.split("T")[0].split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("vi-VN");
}

function compactColor(index) {
    const colors = [
        "hsl(var(--primary))",
        "hsl(142 70% 45%)",
        "hsl(38 92% 50%)",
        "hsl(0 75% 55%)",
        "hsl(188 78% 41%)",
        "hsl(262 83% 58%)",
    ];
    return colors[index % colors.length];
}

function Metric({ title, value, icon: Icon, tone = "text-primary" }) {
    return (
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${tone}`}>
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
                <span className="block truncate text-xs text-muted-foreground">{title}</span>
                <span className="block text-lg font-semibold leading-tight text-foreground">{value}</span>
            </span>
        </div>
    );
}

function CompactBreakdown({ title, items, maxValue, emptyText }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <div className="mt-3 space-y-2.5">
                {items.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
                ) : (
                    items.map((item) => (
                        <div key={item.key} className="space-y-1">
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="truncate text-foreground">{item.label}</span>
                                <span className="shrink-0 font-semibold text-muted-foreground">{item.value}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${maxValue > 0 ? Math.max(8, (item.value / maxValue) * 100) : 0}%`,
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function ProjectOverviewPage() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const { projectData } = useOutletContext();
    const { issues = [], issuesLoading, workflowStatuses = [], issuePriorities = [], issueTypes = [] } = useProject();

    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activityLoadingMore, setActivityLoadingMore] = useState(false);
    const activityPageRef = useRef(0);
    const activityHasMoreRef = useRef(false);
    const activityLoadingMoreRef = useRef(false);
    const activitySentinelRef = useRef(null);

    useEffect(() => {
        setActivitiesLoading(true);
        setActivities([]);
        activityPageRef.current = 0;
        activityHasMoreRef.current = false;
        activityLoadingMoreRef.current = false;
        projectService.getActivities(projectId, 0, 20)
            .then((res) => {
                setActivities(res.content || []);
                activityHasMoreRef.current = !res.last;
            })
            .catch(() => setActivities([]))
            .finally(() => setActivitiesLoading(false));
    }, [projectId]);

    const loadMoreActivities = useCallback(() => {
        if (activityLoadingMoreRef.current || !activityHasMoreRef.current) return;
        activityLoadingMoreRef.current = true;
        setActivityLoadingMore(true);
        const next = activityPageRef.current + 1;
        projectService.getActivities(projectId, next, 20)
            .then((res) => {
                setActivities((prev) => [...prev, ...(res.content || [])]);
                activityHasMoreRef.current = !res.last;
                activityPageRef.current = next;
            })
            .catch(() => {})
            .finally(() => {
                activityLoadingMoreRef.current = false;
                setActivityLoadingMore(false);
            });
    }, [projectId]);

    useEffect(() => {
        const el = activitySentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) loadMoreActivities();
        }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [loadMoreActivities, activitiesLoading]);

    const overview = useMemo(() => {
        const statusById = new Map(workflowStatuses.map((status) => [status.id, status]));
        const priorityById = new Map(issuePriorities.map((priority) => [priority.id, priority]));
        const typeById = new Map(issueTypes.map((type) => [type.id, type]));
        const statusCounts = new Map();
        const priorityCounts = new Map();
        const typeCounts = new Map();
        const today = new Date();
        const nextWeek = new Date();
        today.setHours(0, 0, 0, 0);
        nextWeek.setDate(today.getDate() + 7);

        let completed = 0;
        let inProgress = 0;
        let todo = 0;
        let dueSoon = 0;

        issues.forEach((issue) => {
            const status = statusById.get(issue.statusId);
            const category = status?.category || "TODO";
            if (category === "DONE") completed++;
            else if (category === "IN_PROGRESS") inProgress++;
            else todo++;

            const statusLabel = status?.name || "Unknown";
            statusCounts.set(statusLabel, {
                key: statusLabel,
                label: statusLabel,
                value: (statusCounts.get(statusLabel)?.value || 0) + 1,
                color: status?.color || compactColor(statusCounts.size),
            });

            const priority = priorityById.get(issue.priorityId);
            const priorityLabel = priority?.name || "None";
            priorityCounts.set(priorityLabel, {
                key: priorityLabel,
                label: priorityLabel,
                value: (priorityCounts.get(priorityLabel)?.value || 0) + 1,
                color: priority?.color || compactColor(priorityCounts.size + 2),
            });

            const type = typeById.get(issue.issueTypeId);
            const typeLabel = type?.name || "Task";
            typeCounts.set(typeLabel, {
                key: typeLabel,
                label: typeLabel,
                value: (typeCounts.get(typeLabel)?.value || 0) + 1,
                color: compactColor(typeCounts.size + 3),
            });

            if (issue.dueDate && category !== "DONE") {
                const [y, m, d] = issue.dueDate.toString().split("T")[0].split("-").map(Number);
                const due = new Date(y, m - 1, d);
                if (due >= today && due <= nextWeek) dueSoon++;
            }
        });

        const total = issues.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const statusItems = Array.from(statusCounts.values());
        const priorityItems = Array.from(priorityCounts.values());
        const typeItems = Array.from(typeCounts.values());

        return {
            total,
            completed,
            inProgress,
            todo,
            dueSoon,
            progress,
            statusSlices: buildDonutSlices(statusItems),
            priorityItems,
            typeItems,
            priorityMax: Math.max(...priorityItems.map((item) => item.value), 0),
            typeMax: Math.max(...typeItems.map((item) => item.value), 0),
        };
    }, [issues, issuePriorities, issueTypes, workflowStatuses]);

    const displayedProgress = projectData?.progress ?? overview.progress;

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <CardContent className="p-4">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)]">
                        <div className="min-w-0 space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {projectData?.description || t("projects.detail.overview.noData")}
                                    </p>
                                </div>
                                <div className="grid shrink-0 grid-cols-2 gap-2 text-xs sm:min-w-72">
                                    <div className="rounded-lg bg-muted px-3 py-2">
                                        <p className="text-muted-foreground">{t("projects.form.startDate")}</p>
                                        <p className="font-medium text-foreground">{formatDate(projectData?.startDate)}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted px-3 py-2">
                                        <p className="text-muted-foreground">{t("projects.form.endDate")}</p>
                                        <p className="font-medium text-foreground">{formatDate(projectData?.endDate)}</p>
                                    </div>
                                </div>
                            </div>

                            {issuesLoading ? (
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton key={index} className="h-16 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                    <Metric title={t("projects.detail.overview.statistics.totalTasks")} value={overview.total} icon={ClipboardList} />
                                    <Metric title={t("projects.detail.overview.statistics.completed")} value={overview.completed} icon={CheckCircle2} tone="text-emerald-600" />
                                    <Metric title={t("projects.detail.overview.statistics.inProgress")} value={overview.inProgress} icon={RefreshCw} tone="text-blue-600" />
                                    <Metric title={t("ui.common.dueSoon")} value={overview.dueSoon} icon={AlarmClock} tone="text-amber-600" />
                                </div>
                            )}

                            <div className="rounded-xl border border-border bg-background/70 px-3 py-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-foreground">{t("projects.detail.overview.statistics.completionRate")}</span>
                                    <span className="text-sm font-semibold text-foreground">{displayedProgress}%</span>
                                </div>
                                <Progress value={displayedProgress} />
                            </div>
                        </div>

                        {issuesLoading ? (
                            <Skeleton className="h-full min-h-64 rounded-2xl" />
                        ) : (
                            <DonutChart
                                compact
                                title={t("projects.detail.overview.charts.statusBreakdown")}
                                meta={t("dashboard.marketPanel.taskCount", { count: overview.total })}
                                centerValue={overview.total}
                                centerLabel={t("projects.detail.overview.statistics.totalTasks")}
                                slices={overview.statusSlices}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {issuesLoading ? (
                        <>
                            <Skeleton className="h-52 rounded-2xl" />
                            <Skeleton className="h-52 rounded-2xl" />
                        </>
                    ) : (
                        <>
                            <CompactBreakdown
                                title={t("projects.detail.overview.charts.priorityBreakdown")}
                                items={overview.priorityItems}
                                maxValue={overview.priorityMax}
                                emptyText={t("projects.detail.overview.noData")}
                            />
                            <CompactBreakdown
                                title={t("projects.detail.overview.charts.workTypesBreakdown")}
                                items={overview.typeItems}
                                maxValue={overview.typeMax}
                                emptyText={t("projects.detail.overview.noData")}
                            />
                        </>
                    )}
                </div>

                <Card className="min-h-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="h-4 w-4" />
                            {t("dashboard.calendar.title")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[390px] overflow-hidden px-4 pb-4">
                        <Calendar projectId={projectId} />
                    </CardContent>
                </Card>
            </div>

            <Card className="min-h-0">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("projects.detail.overview.recentActivity", "Recent Activity")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {activitiesLoading ? (
                        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {t("projects.detail.overview.noActivity", "No recent activity")}
                        </p>
                    ) : (
                        <div className="max-h-72 overflow-y-auto px-4 pb-2">
                            <div className="grid gap-x-5 xl:grid-cols-2">
                                {activities.map((activity, index) => (
                                    <ActivityLogItem
                                        key={activity.id || index}
                                        log={activity}
                                        workflowStatuses={workflowStatuses}
                                        showIssue
                                    />
                                ))}
                            </div>
                            <div ref={activitySentinelRef} className="h-px" />
                            {activityLoadingMore && (
                                <p className="py-2 text-center text-xs text-muted-foreground">Loading...</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
