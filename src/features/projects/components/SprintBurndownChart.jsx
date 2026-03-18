import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sprintService } from "@/features/projects/api/sprintService";
import Skeleton from "@/components/ui/Skeleton";

function getPolyline(points, valueKey, width, height, minY, maxY) {
    if (!points.length) return "";

    return points
        .map((point, index) => {
            const x = (index / (points.length - 1 || 1)) * (width - 24) + 12;
            const rawValue = Number(point[valueKey] ?? 0);
            const y = height - ((rawValue - minY) / (maxY - minY || 1)) * (height - 24) - 12;
            return `${x},${y}`;
        })
        .join(" ");
}

export default function SprintBurndownChart({ projectId, sprintId, data = null, showStats = true }) {
    const { t } = useTranslation();
    const [burndown, setBurndown] = useState(data);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data) {
            setBurndown(data);
        }
    }, [data]);

    useEffect(() => {
        if (data) return;
        if (!projectId || !sprintId) return;

        let mounted = true;
        setLoading(true);

        sprintService
            .getBurndown(projectId, sprintId)
            .then((data) => {
                if (mounted) setBurndown(data || null);
            })
            .catch(() => {
                if (mounted) setBurndown(null);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [projectId, sprintId, data]);

    const points = useMemo(() => burndown?.points || [], [burndown]);

    const { idealPolyline, actualPolyline, minY, maxY } = useMemo(() => {
        const values = points.flatMap((point) => [Number(point.idealRemaining ?? 0), Number(point.actualRemaining ?? 0)]);
        const maxValue = values.length ? Math.max(...values, 1) : 1;
        const minValue = values.length ? Math.min(...values, 0) : 0;
        const width = 520;
        const height = 180;

        return {
            minY: minValue,
            maxY: maxValue,
            idealPolyline: getPolyline(points, "idealRemaining", width, height, minValue, maxValue),
            actualPolyline: getPolyline(points, "actualRemaining", width, height, minValue, maxValue),
        };
    }, [points]);

    if (loading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (!burndown || points.length === 0) {
        return (
            <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                {t("sprints.burndown.noData", "No burndown data")}
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border bg-background/60 p-3">
            {showStats && (
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{t("sprints.burndown.total", "Total")} : <strong className="text-foreground">{burndown.totalStoryPoints || 0}</strong></span>
                    <span>{t("sprints.burndown.remaining", "Remaining")} : <strong className="text-foreground">{burndown.currentRemaining || 0}</strong></span>
                    <span>{t("sprints.burndown.completed", "Completed")} : <strong className="text-foreground">{Math.max(0, (burndown.totalStoryPoints || 0) - (burndown.currentRemaining || 0))}</strong></span>
                </div>
            )}

            <svg viewBox="0 0 520 180" className="h-44 w-full">
                <polyline fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4 4" points={idealPolyline} />
                <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" points={actualPolyline} />
                <text x="8" y="16" fontSize="10" fill="hsl(var(--muted-foreground))">{maxY}</text>
                <text x="8" y="174" fontSize="10" fill="hsl(var(--muted-foreground))">{minY}</text>
            </svg>

            <div className="mt-1 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-[2px] w-4 bg-primary" />
                    {t("sprints.burndown.actual", "Actual")}
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-[2px] w-4 border-t border-dashed border-muted-foreground" />
                    {t("sprints.burndown.ideal", "Ideal")}
                </span>
            </div>
        </div>
    );
}
