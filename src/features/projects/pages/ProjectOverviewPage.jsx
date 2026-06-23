import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Activity,
    AlarmClock,
    CalendarDays,
    Layers3,
    PieChart,
    Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/skeleton";
import { buildDonutSlices } from "@/components/ui/donutUtils";
import { projectService } from "@/features/projects/api/projectService";
import { useProject } from "@/features/projects/context/ProjectContext";
import { getActivityMeta } from "@/features/projects/utils/issueStyles";
import { cn, timeAgo } from "@/lib/utils";

function parseDate(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.toString().split("T")[0].split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function formatDate(dateString) {
    const date = parseDate(dateString);
    return date ? date.toLocaleDateString("vi-VN") : "-";
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

function getIssueCode(log) {
    if (typeof log?.details === "string") {
        const match = log.details.match(/\b[A-Z][A-Z0-9]+-\d+\b/);
        if (match) return match[0];
    }
    return log?.taskCode || log?.issueKey || log?.issueCode || log?.code || null;
}

function AnalyticBars({ title, icon, items, total, emptyText }) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    {createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        {emptyText}
                    </p>
                ) : (
                    items.map((item) => {
                        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                            <div
                                key={item.key}
                                className="group w-full rounded-lg border border-transparent p-2 text-left transition-all hover:border-border hover:bg-muted/45"
                            >
                                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                    <span className="min-w-0 truncate font-medium text-foreground">{item.label}</span>
                                    <span className="shrink-0 text-muted-foreground">
                                        <span className="font-semibold text-foreground">{item.value}</span> · {percent}%
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full transition-all group-hover:scale-x-[1.02]"
                                        style={{ width: `${Math.max(4, percent)}%`, backgroundColor: item.color }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}

function StatusBreakdownWidget({ title, meta, total, slices, items, emptyText }) {
    const [activeKey, setActiveKey] = useState(null);
    const activeSlice = slices.find((slice) => slice.key === activeKey);

    return (
        <Card className="h-full overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PieChart className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{title}</span>
                        </CardTitle>
                        {meta ? <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p> : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        {emptyText}
                    </p>
                ) : (
                    <div className="grid min-h-[260px] grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.75fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(120px,0.7fr)]">
                        <div className="grid min-w-0 place-items-center">
                            <div className="relative grid h-44 w-44 place-items-center sm:h-52 sm:w-52 2xl:h-56 2xl:w-56">
                                <svg viewBox="0 0 120 120" className="-rotate-90 overflow-visible" aria-hidden="true">
                                    <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="13" />
                                    {slices.map((slice) => {
                                        const isActive = slice.key === activeKey;
                                        const isDimmed = activeKey && !isActive;
                                        return (
                                            <circle
                                                key={slice.key}
                                                cx="60"
                                                cy="60"
                                                r={slice.radius}
                                                fill="none"
                                                stroke={slice.color}
                                                strokeWidth={isActive ? 18 : 13}
                                                strokeDasharray={slice.dashArray}
                                                strokeDashoffset={slice.dashOffset}
                                                className={cn("cursor-pointer transition-all duration-200", isDimmed ? "opacity-25" : "opacity-100")}
                                                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                                                onMouseEnter={() => setActiveKey(slice.key)}
                                                onMouseLeave={() => setActiveKey(null)}
                                                onFocus={() => setActiveKey(slice.key)}
                                                onBlur={() => setActiveKey(null)}
                                                tabIndex={0}
                                            />
                                        );
                                    })}
                                </svg>
                                <div className="pointer-events-none absolute grid h-28 w-28 place-items-center rounded-full border border-border bg-card text-center sm:h-32 sm:w-32">
                                    <div className="min-w-0 px-3">
                                        <p className="truncate text-2xl font-bold tracking-tight text-foreground">{activeSlice ? activeSlice.value : total}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {activeSlice ? activeSlice.label : "Total"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid min-w-0 gap-1.5">
                            {items.map((item) => (
                                <div
                                    key={item.key}
                                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                    onMouseEnter={() => setActiveKey(item.key)}
                                    onMouseLeave={() => setActiveKey(null)}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="truncate">{item.label}</span>
                                    </span>
                                    <span className="shrink-0 font-semibold text-foreground">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatusBreakdownSkeleton() {
    return (
        <Card className="h-full overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                        <Skeleton className="h-5 w-44 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid min-h-[260px] grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.75fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(120px,0.7fr)]">
                    <div className="grid min-w-0 place-items-center">
                        <Skeleton className="h-44 w-44 rounded-full sm:h-52 sm:w-52 2xl:h-56 2xl:w-56" />
                    </div>
                    <div className="grid min-w-0 gap-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                                    <Skeleton className="h-3 w-24 rounded-md" />
                                </div>
                                <Skeleton className="h-3 w-8 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TimelineCard({ projectData, t }) {
    const start = parseDate(projectData?.startDate);
    const end = parseDate(projectData?.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalMs = start && end ? Math.max(end - start, 1) : 1;
    const elapsedMs = start ? Math.max(today - start, 0) : 0;
    const timelineProgress = start && end ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100))) : 0;
    const daysLeft = end ? Math.ceil((end - today) / (24 * 60 * 60 * 1000)) : null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {t("projects.detail.tabs.timeline", "Timeline")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                        <p className="text-xs text-muted-foreground">{t("projects.form.startDate")}</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(projectData?.startDate)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                        <p className="text-xs text-muted-foreground">{t("projects.form.endDate")}</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(projectData?.endDate)}</p>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="relative h-3 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${timelineProgress}%` }} />
                        <span
                            className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground shadow-sm"
                            style={{ left: `${timelineProgress}%` }}
                            title={t("ui.common.today", "Today")}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t("projects.form.startDate")}</span>
                        <span>
                            {daysLeft == null
                                ? t("projects.detail.overview.noData")
                                : daysLeft >= 0
                                    ? `${daysLeft} ${t("ui.common.daysLeft", "days left")}`
                                    : t("projects.status.completed", "Completed")}
                        </span>
                        <span>{t("projects.form.endDate")}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ActivityFeed({ activities, loading, loadingMore, sentinelRef, workflowStatuses, t, error, onRetry }) {
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 rounded-xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-10 text-center">
                <Activity className="mx-auto h-6 w-6 text-destructive" />
                <p className="mt-2 text-sm font-medium text-foreground">
                    {t("projects.detail.overview.activityLoadError", "Unable to load recent activity")}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    {t("projects.detail.overview.activityLoadErrorDescription", "Please try again.")}
                </p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                    {t("ui.common.retry", "Retry")}
                </button>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
                <Activity className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                    {t("projects.detail.overview.noActivity", "No recent activity")}
                </p>
            </div>
        );
    }

    return (
        <div className="max-h-[430px] space-y-1 overflow-y-auto pr-1">

            {activities.map((activity, index) => {
                const { icon: Icon, color } = getActivityMeta(activity.action);
                const issueCode = getIssueCode(activity);
                return (
                    <div
                        key={activity.id || index}
                        className="group flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/45"
                    >
                        <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", color)}>
                            <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                {activity.userImage ? (
                                    <img src={activity.userImage} alt={activity.userName || ""} className="h-5 w-5 rounded-full object-cover" />
                                ) : (
                                    <Avatar name={activity.userName || "?"} size="xs" />
                                )}
                                <span className="truncate text-xs font-semibold text-foreground">{activity.userName || "Unknown"}</span>
                                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground" title={activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ""}>
                                    {timeAgo(activity.createdAt)}
                                </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                {issueCode ? <span className="font-medium text-foreground">{issueCode}</span> : null}
                                {issueCode ? " · " : ""}
                                {activity.details || activity.action}
                            </p>
                            {activity.action === "ISSUE_STATUS_CHANGED" && (activity.oldValue || activity.newValue) ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {[activity.oldValue, activity.newValue].filter(Boolean).map((value) => {
                                        const status = workflowStatuses.find((item) => item.id === value || item.name === value);
                                        return (
                                            <span key={value} className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-foreground">
                                                {status?.name || value}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </div>
                );
            })}
            <div ref={sentinelRef} className="h-px" />
            {loadingMore ? <p className="py-2 text-center text-xs text-muted-foreground">Loading...</p> : null}
        </div>
    );
}

function MembersPanel({ members, loading, t }) {
    const visibleMembers = members.slice(0, 5);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {t("projects.detail.tabs.members", "Members")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-9 rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex -space-x-2">
                            {visibleMembers.map((member) => (
                                <Avatar
                                    key={member.userId || member.id}
                                    user={{ avatar: member.userImage, name: member.userName || member.userEmail }}
                                    name={member.userName || member.userEmail}
                                    size="sm"
                                    className="border-2 border-card"
                                />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{members.length}</span> {t("projects.detail.tabs.members", "Members")}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function ProjectOverviewPage() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const { projectData } = useOutletContext();
    const {
        issues = [],
        issuesLoading,
        workflowStatuses = [],
        issuePriorities = [],
        issueTypes = [],
        members = [],
        membersLoading,
    } = useProject();

    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activitiesError, setActivitiesError] = useState(null);
    const [activityLoadingMore, setActivityLoadingMore] = useState(false);
    const activityPageRef = useRef(0);
    const activityHasMoreRef = useRef(false);
    const activityLoadingMoreRef = useRef(false);
    const activitySentinelRef = useRef(null);

    const loadInitialActivities = useCallback(() => {
        setActivitiesLoading(true);
        setActivitiesError(null);
        setActivities([]);
        activityPageRef.current = 0;
        activityHasMoreRef.current = false;
        activityLoadingMoreRef.current = false;
        return projectService.getActivities(projectId, 0, 20)
            .then((res) => {
                setActivities(res.content || []);
                activityHasMoreRef.current = !res.last;
            })
            .catch((error) => {
                console.error("Error loading activities:", error);
                setActivities([]);
                setActivitiesError(error);
            })
            .finally(() => setActivitiesLoading(false));
    }, [projectId]);

    useEffect(() => {
        loadInitialActivities();
    }, [loadInitialActivities]);

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
            .catch((error) => console.error("Error loading more activities:", error))
            .finally(() => {
                activityLoadingMoreRef.current = false;
                setActivityLoadingMore(false);
            });
    }, [projectId]);

    useEffect(() => {
        const el = activitySentinelRef.current;
        if (!el) return undefined;
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
        today.setHours(0, 0, 0, 0);

        let completed = 0;
        let inProgress = 0;
        let overdue = 0;

        issues.forEach((issue) => {
            const status = statusById.get(issue.statusId);
            const category = status?.category || "TODO";
            if (category === "DONE") completed += 1;
            if (category === "IN_PROGRESS") inProgress += 1;

            const due = parseDate(issue.dueDate);
            if (due && due < today && category !== "DONE") overdue += 1;

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
            overdue,
            progress,
            statusItems,
            statusSlices: buildDonutSlices(statusItems),
            priorityItems,
            typeItems,
        };
    }, [issues, issuePriorities, issueTypes, workflowStatuses]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <main className="space-y-4 xl:col-span-8">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                        <div className="space-y-4">
                            <TimelineCard projectData={projectData} t={t} />
                            <MembersPanel members={members} loading={membersLoading} t={t} />
                        </div>

                        {issuesLoading ? (
                            <StatusBreakdownSkeleton />
                        ) : (
                            <StatusBreakdownWidget
                                title={t("projects.detail.overview.charts.statusBreakdown")}
                                meta={t("dashboard.marketPanel.taskCount", { count: overview.total })}
                                total={overview.total}
                                slices={overview.statusSlices}
                                items={overview.statusItems}
                                emptyText={t("projects.detail.overview.noData")}
                            />
                        )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <AnalyticBars
                            title={t("projects.detail.overview.charts.priorityBreakdown")}
                            icon={AlarmClock}
                            items={overview.priorityItems}
                            total={overview.total}
                            emptyText={t("projects.detail.overview.noData")}
                        />
                        <AnalyticBars
                            title={t("projects.detail.overview.charts.workTypesBreakdown")}
                            icon={Layers3}
                            items={overview.typeItems}
                            total={overview.total}
                            emptyText={t("projects.detail.overview.noData")}
                        />
                    </div>
                </main>

                <aside className="space-y-4 xl:col-span-4">
                    <Card className="min-h-[420px]">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                {t("projects.detail.overview.recentActivity", "Recent Activity")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ActivityFeed
                                activities={activities}
                                loading={activitiesLoading}
                                loadingMore={activityLoadingMore}
                                error={activitiesError}
                                onRetry={loadInitialActivities}
                                sentinelRef={activitySentinelRef}
                                workflowStatuses={workflowStatuses}
                                t={t}
                            />
                        </CardContent>
                    </Card>

                </aside>
            </div>
        </div>
    );
}
