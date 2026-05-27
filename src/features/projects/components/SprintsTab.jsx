import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Skeleton from "@/components/ui/skeleton";
import { useProject } from "@/features/projects/context/ProjectContext";
import { sprintService } from "@/features/projects/api/sprintService";
import { toast } from "sonner";
import { validateDates, todayStr } from "@/features/projects/utils/dateValidation";
import {
  Plus, Play, CheckCircle2, XCircle, Calendar, Target,
  Clock, Pencil, Trash2
} from "lucide-react";

const STATUS_COLORS = {
  PLANNED: {
    card: "border-border bg-card hover:bg-muted/30",
    badge: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    rail: "bg-border",
  },
  ACTIVE: {
    card: "border-blue-400/50 bg-card hover:bg-blue-500/5 dark:border-blue-500/40 dark:hover:bg-blue-500/10",
    badge: "border-blue-200 bg-blue-100/80 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
    rail: "bg-blue-500",
  },
  COMPLETED: {
    card: "border-green-400/50 bg-card hover:bg-green-500/5 dark:border-green-500/40 dark:hover:bg-green-500/10",
    badge: "border-green-200 bg-green-100/80 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300",
    dot: "bg-green-500",
    rail: "bg-green-500",
  },
  CANCELLED: {
    card: "border-red-400/50 bg-card hover:bg-red-500/5 dark:border-red-500/40 dark:hover:bg-red-500/10",
    badge: "border-red-200 bg-red-100/80 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
    rail: "bg-red-500",
  },
};

const dateValue = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const sortSprintsSequentially = (items) => [...items].sort((a, b) => {
  const byStart = dateValue(a.startDate) - dateValue(b.startDate);
  if (byStart !== 0) return byStart;

  const byEnd = dateValue(a.endDate) - dateValue(b.endDate);
  if (byEnd !== 0) return byEnd;

  const byOrder = (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
  if (byOrder !== 0) return byOrder;

  return String(a.name || "").localeCompare(String(b.name || ""));
});

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : null;

const dayDiff = (from, to) => Math.ceil((to - from) / (24 * 60 * 60 * 1000));

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getSprintTimingMeta = (sprint, t) => {
  const today = getToday();
  const start = sprint.startDate ? new Date(sprint.startDate) : null;
  const end = sprint.endDate ? new Date(sprint.endDate) : null;
  start?.setHours(0, 0, 0, 0);
  end?.setHours(0, 0, 0, 0);

  if (sprint.status === "PLANNED" && start && today > start) {
    return {
      label: t("sprints.timing.startOverdue", "Start overdue"),
      className: "border-amber-200 bg-amber-100/80 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    };
  }

  if (sprint.status === "ACTIVE" && start && end) {
    const totalDays = Math.max(dayDiff(start, end) + 1, 1);
    const currentDay = Math.min(Math.max(dayDiff(start, today) + 1, 1), totalDays);
    const daysLeft = Math.max(dayDiff(today, end), 0);
    return {
      label: daysLeft > 0
        ? t("sprints.timing.activeWithDays", `Day ${currentDay}/${totalDays} - ${daysLeft} days left`, { currentDay, totalDays, daysLeft })
        : t("sprints.timing.endsToday", `Day ${currentDay}/${totalDays} - ends today`, { currentDay, totalDays }),
      className: "border-blue-200 bg-blue-100/80 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };
  }

  return null;
};

export default function SprintsTab() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { sprints, sprintsLoading, refreshSprints, refreshIssues } = useProject();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [formData, setFormData] = useState({ name: "", goal: "", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setFormData({ name: "", goal: "", startDate: "", endDate: "" });
    setEditingSprint(null);
    setShowCreateModal(true);
  };

  const openEditModal = (sprint) => {
    setFormData({
      name: sprint.name || "",
      goal: sprint.goal || "",
      startDate: sprint.startDate ? sprint.startDate.split("T")[0] : "",
      endDate: sprint.endDate ? sprint.endDate.split("T")[0] : "",
    });
    setEditingSprint(sprint);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.warning(t("sprints.messages.nameRequired", "Sprint name is required"));
      return;
    }
    const dateError = validateDates({ startDate: formData.startDate, endDate: formData.endDate, allowPastStart: !!editingSprint });
    if (dateError) { toast.warning(dateError); return; }
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        goal: formData.goal || undefined,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };
      if (editingSprint) {
        await sprintService.updateSprint(projectId, editingSprint.id, payload);
        toast.success(t("sprints.messages.updated", "Sprint updated"));
      } else {
        await sprintService.createSprint(projectId, payload);
        toast.success(t("sprints.messages.created", "Sprint created"));
      }
      await refreshSprints();
      setShowCreateModal(false);
    } catch (e) {
      toast.error(e?.message || "Error saving sprint");
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async (sprint) => {
    try {
      await sprintService.startSprint(projectId, sprint.id);
      toast.success(t("sprints.messages.started", "Sprint started"));
      await refreshSprints();
    } catch (e) {
      toast.error(e?.message || "Error starting sprint");
    }
  };

  const handleComplete = async (sprint) => {
    try {
      await sprintService.completeSprint(projectId, sprint.id);
      toast.success(t("sprints.messages.completed", "Sprint completed"));
      await Promise.all([refreshSprints(), refreshIssues()]);
    } catch (e) {
      toast.error(e?.message || "Error completing sprint");
    }
  };

  const handleCancel = async (sprint) => {
    try {
      await sprintService.cancelSprint(projectId, sprint.id);
      toast.success(t("sprints.messages.cancelled", "Sprint cancelled"));
      await Promise.all([refreshSprints(), refreshIssues()]);
    } catch (e) {
      toast.error(e?.message || "Error cancelling sprint");
    }
  };

  const handleDelete = async (sprint) => {
    if (!confirm(t("sprints.messages.deleteConfirm", "Delete this sprint?"))) return;
    try {
      await sprintService.deleteSprint(projectId, sprint.id);
      toast.success(t("sprints.messages.deleted", "Sprint deleted"));
      await refreshSprints();
    } catch (e) {
      toast.error(e?.message || "Error deleting sprint");
    }
  };

  if (sprintsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const orderedSprints = sortSprintsSequentially(sprints);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t("sprints.title", "Sprints")}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({sprints.length})</span>
        </h2>
        <Button size="sm" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1" /> {t("sprints.create", "Create Sprint")}
        </Button>
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("sprints.empty", "No sprints yet. Create your first sprint!")}</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />
          <div className="space-y-4">
            {orderedSprints.map((sprint, index) => {
              const colors = STATUS_COLORS[sprint.status] || STATUS_COLORS.PLANNED;
              const startDate = formatDate(sprint.startDate);
              const endDate = formatDate(sprint.endDate);
              const isLast = index === orderedSprints.length - 1;
              const timingMeta = getSprintTimingMeta(sprint, t);
              const plannedLabel = startDate && endDate
                ? `${startDate} - ${endDate}`
                : startDate || endDate || t("sprints.noPlannedDates", "No planned dates");

              return (
                <div key={sprint.id} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                  {!isLast && (
                    <div className={`absolute left-5 top-10 h-[calc(100%+1rem)] w-px ${colors.rail}`} />
                  )}
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                    <span className={`absolute inset-1 rounded-full ${colors.dot} opacity-15`} />
                    <span className="relative text-xs font-semibold text-foreground">
                      {index + 1}
                    </span>
                  </div>

                  <div className={`rounded-lg border p-4 shadow-sm transition-colors ${colors.card}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{sprint.name}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                            {sprint.status}
                          </span>
                          {timingMeta && (
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${timingMeta.className}`}>
                              {timingMeta.label}
                            </span>
                          )}
                        </div>

                        {sprint.goal && (
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0">{sprint.goal}</span>
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                            <Calendar className="h-3 w-3" />
                            {t("sprints.plannedDates", "Planned")} {plannedLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 md:ml-4">
                        {sprint.status === "PLANNED" && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleStart(sprint)} title="Start Sprint">
                              <Play className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEditModal(sprint)} title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(sprint)} title="Delete">
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        {sprint.status === "ACTIVE" && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleComplete(sprint)} title="Complete Sprint">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleCancel(sprint)} title="Cancel Sprint">
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingSprint
          ? t("sprints.edit", "Edit Sprint")
          : t("sprints.create", "Create Sprint")
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={saving}>
              {t("ui.common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("ui.common.loading") : t("ui.common.save")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("sprints.form.name", "Sprint Name")} *
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("sprints.form.namePlaceholder", "e.g. Sprint 1")}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("sprints.form.goal", "Sprint Goal")}
            </label>
            <Textarea
              value={formData.goal}
              onChange={e => setFormData({ ...formData, goal: e.target.value })}
              placeholder={t("sprints.form.goalPlaceholder", "What is the goal of this sprint?")}
              rows={2}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("sprints.form.startDate", "Start Date")}
              </label>
              <Input
                type="date"
                min={todayStr()}
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("sprints.form.endDate", "End Date")}
              </label>
              <Input
                type="date"
                min={formData.startDate || todayStr()}
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
