import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Megaphone, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import Skeleton from "@/components/ui/Skeleton";
import { useDashboard } from "@/features/dashboard/context/DashboardContext";
import DonutChart, { buildDonutSlices } from "@/components/ui/DonutChart";
import { cn } from "@/lib/utils";

export default function DashboardMarketPanel({ className = "" }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { stats, loading } = useDashboard();

    const data = useMemo(() => {
        const total = stats?.total || 0;
        const todo = stats?.todo || 0;
        const inProgress = stats?.inProgress || 0;
        const completed = stats?.completed || 0;
        const overdue = stats?.overdue || 0;

        return {
            total,
            taskSlices: buildDonutSlices([
                { key: "todo", label: t("dashboard.marketPanel.segments.backlog"), value: todo, color: "hsl(215 20% 65%)" },
                { key: "doing", label: t("dashboard.marketPanel.segments.doing"), value: inProgress, color: "hsl(var(--primary))" },
                { key: "done", label: t("dashboard.marketPanel.segments.done"), value: completed, color: "hsl(142 70% 45%)" },
                { key: "late", label: t("dashboard.marketPanel.segments.overdue"), value: overdue, color: "hsl(0 75% 55%)" },
            ]),
        };
    }, [stats, t]);

    if (loading) {
        return (
            <Card className={cn("h-full min-h-[320px] rounded-2xl border-border bg-card p-4 shadow-sm", className)}>
                <div className="grid h-full items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                    <Skeleton className="h-full min-h-64 rounded-2xl" />
                    <Skeleton className="h-full min-h-64 rounded-2xl" />
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("h-full overflow-hidden rounded-2xl border-border bg-card p-4 text-card-foreground shadow-sm", className)}>
            <div className="grid h-full items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                <button
                    type="button"
                    onClick={() => navigate("/premium")}
                    className="flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background/70 p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                        <Megaphone className="h-5 w-5" />
                    </span>

                    <span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            {t("dashboard.marketPanel.eyebrow")}
                        </span>
                        <span className="mt-4 block text-xl font-semibold tracking-tight text-foreground">
                            {t("dashboard.marketPanel.promoTitle")}
                        </span>
                        <span className="mt-2 block text-sm text-muted-foreground">
                            {t("dashboard.marketPanel.promoDescription")}
                        </span>
                    </span>

                    <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
                        {t("dashboard.marketPanel.promoCta")}
                        <ArrowUpRight className="h-4 w-4" />
                    </span>
                </button>

                <div className="min-w-0">
                    <DonutChart
                        title={t("dashboard.marketPanel.distributionTitle")}
                        meta={t("dashboard.marketPanel.taskCount", { count: data.total })}
                        centerValue={data.total}
                        centerLabel={t("dashboard.marketPanel.taskLabel")}
                        slices={data.taskSlices}
                    />
                </div>
            </div>
        </Card>
    );
}
