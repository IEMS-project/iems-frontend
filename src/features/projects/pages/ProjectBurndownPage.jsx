import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProject } from "@/features/projects/context/ProjectContext";
import { sprintService } from "@/features/projects/api/sprintService";
import SprintBurndownChart from "@/features/projects/components/SprintBurndownChart";
import Skeleton from "@/components/ui/Skeleton";

export default function ProjectBurndownPage() {
    const { t } = useTranslation();
    const { sprints, sprintsLoading, refreshSprints, projectData } = useProject();
    const [selectedSprintId, setSelectedSprintId] = useState("");
    const [burndown, setBurndown] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        refreshSprints();
    }, [refreshSprints]);

    const sprintOptions = useMemo(() => {
        return [...(sprints || [])].sort((a, b) => {
            const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2, CANCELLED: 3 };
            return (order[a.status] ?? 4) - (order[b.status] ?? 4);
        });
    }, [sprints]);

    useEffect(() => {
        if (!sprintOptions.length) {
            setSelectedSprintId("");
            return;
        }
        if (selectedSprintId && sprintOptions.some((s) => s.id === selectedSprintId)) {
            return;
        }
        const activeSprint = sprintOptions.find((s) => s.status === "ACTIVE");
        setSelectedSprintId((activeSprint || sprintOptions[0]).id);
    }, [sprintOptions, selectedSprintId]);

    useEffect(() => {
        if (!projectData?.id || !selectedSprintId) {
            setBurndown(null);
            return;
        }

        let mounted = true;
        setLoading(true);

        sprintService
            .getBurndown(projectData.id, selectedSprintId)
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
    }, [projectData?.id, selectedSprintId]);

    const completedPoints = Math.max(0, (burndown?.totalStoryPoints || 0) - (burndown?.currentRemaining || 0));
    const progressPercent = (burndown?.totalStoryPoints || 0) > 0
        ? Math.round((completedPoints / burndown.totalStoryPoints) * 100)
        : 0;

    if (sprintsLoading) {
        return <Skeleton className="h-72 w-full" />;
    }

    if (!sprintOptions.length) {
        return (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                {t("sprints.empty", "No sprints yet. Create your first sprint!")}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
                <label className="mb-2 block text-sm font-medium text-foreground">
                    {t("sprints.burndown.selectSprint", "Select sprint")}
                </label>
                <select
                    value={selectedSprintId}
                    onChange={(e) => setSelectedSprintId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                    {sprintOptions.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                            {sprint.name} ({sprint.status})
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <Skeleton className="h-72 w-full" />
            ) : !burndown ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                    {t("sprints.burndown.noData", "No burndown data")}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">{t("sprints.burndown.total", "Total")}</p>
                            <p className="text-2xl font-semibold text-foreground">{burndown.totalStoryPoints || 0}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">{t("sprints.burndown.completed", "Completed")}</p>
                            <p className="text-2xl font-semibold text-foreground">{completedPoints}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">{t("sprints.burndown.remaining", "Remaining")}</p>
                            <p className="text-2xl font-semibold text-foreground">{burndown.currentRemaining || 0}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">{t("sprints.burndown.progress", "Progress")}</p>
                            <p className="text-2xl font-semibold text-foreground">{progressPercent}%</p>
                        </div>
                    </div>

                    <SprintBurndownChart data={burndown} showStats={false} />
                </>
            )}
        </div>
    );
}
