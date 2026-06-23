import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ChevronLeft, ChevronRight, Megaphone, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";
import { promotionService } from "@/features/admin/api/adminPromotionService";
import { openPromotionUrl } from "@/features/admin/utils/promotionLinks";
import { useDashboard } from "@/features/dashboard/context/DashboardContext";
import DonutChart from "@/components/ui/DonutChart";
import { buildDonutSlices } from "@/components/ui/donutUtils";
import { cn } from "@/lib/utils";

export default function DashboardMarketPanel({ className = "" }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { stats, loading } = useDashboard();
    const [promotions, setPromotions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        promotionService.getActivePromotions("DASHBOARD")
            .then((items) => setPromotions(Array.isArray(items) ? items : []))
            .catch(() => setPromotions([]));
    }, []);

    useEffect(() => {
        if (promotions.length < 2) {
            setActiveIndex(0);
            return undefined;
        }

        const timer = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % promotions.length);
        }, 5000);

        return () => window.clearInterval(timer);
    }, [promotions.length]);

    const promotion = promotions[activeIndex] || null;
    const hasPromotionCta = !!promotion?.ctaUrl;
    const canSlide = promotions.length > 1;

    const showPreviousPromotion = () => {
        if (!canSlide) return;
        setActiveIndex((current) => (current - 1 + promotions.length) % promotions.length);
    };

    const showNextPromotion = () => {
        if (!canSlide) return;
        setActiveIndex((current) => (current + 1) % promotions.length);
    };

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
                <div
                    style={promotion?.imageUrl ? { backgroundImage: `url(${promotion.imageUrl})` } : undefined}
                    className={cn(
                        "relative flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-2xl border border-border p-6 text-left",
                        promotion?.imageUrl ? "bg-cover bg-center" : "bg-background/70"
                    )}
                >
                    <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-background/80 text-primary shadow-sm">
                        <Megaphone className="h-5 w-5" />
                    </span>

                    <span className="relative z-10 mt-auto block">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/85 px-2.5 py-1 text-xs font-medium text-primary shadow-sm">
                            <Sparkles className="h-3.5 w-3.5" />
                            {t("dashboard.marketPanel.eyebrow")}
                        </span>
                        <span
                            className={cn(
                                "mt-3 block text-xl font-semibold tracking-tight",
                                promotion?.imageUrl ? "text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]" : "text-foreground"
                            )}
                        >
                            {promotion?.title || t("dashboard.marketPanel.promoTitle")}
                        </span>
                        {!promotion && (
                            <span className="mt-2 block text-sm text-muted-foreground">
                                {t("dashboard.marketPanel.promoDescription")}
                            </span>
                        )}

                        <span className="mt-4 flex items-center justify-between gap-3">
                            {hasPromotionCta ? (
                                <button
                                    type="button"
                                    onClick={() => openPromotionUrl(promotion.ctaUrl, navigate)}
                                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {promotion?.ctaLabel || t("dashboard.marketPanel.promoCta")}
                                    <ArrowUpRight className="h-4 w-4" />
                                </button>
                            ) : <span />}
                            {canSlide && (
                                <span className="flex items-center gap-1.5" aria-label="Promotion slides">
                                    {promotions.map((item, index) => (
                                        <button
                                            type="button"
                                            key={item.id || index}
                                            onClick={() => setActiveIndex(index)}
                                            aria-label={`Show promotion ${index + 1}`}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-white/75"
                                            )}
                                        />
                                    ))}
                                </span>
                            )}
                        </span>
                    </span>

                    {canSlide && (
                        <>
                            <button
                                type="button"
                                onClick={showPreviousPromotion}
                                aria-label="Previous promotion"
                                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={showNextPromotion}
                                aria-label="Next promotion"
                                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>

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
