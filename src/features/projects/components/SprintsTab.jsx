import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Skeleton from "@/components/ui/Skeleton";
import { useProject } from "@/features/projects/context/ProjectContext";
import { sprintService } from "@/features/projects/api/sprintService";
import { toast } from "sonner";
import {
  Plus, Play, CheckCircle2, XCircle, Calendar, Target,
  Clock, Pencil, Trash2
} from "lucide-react";

const STATUS_COLORS = {
  PLANNED: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-400" },
  ACTIVE: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  COMPLETED: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  CANCELLED: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t("sprints.title", "Sprints")}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({sprints.length})</span>
        </h2>
        <Button size="sm" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1" /> {t("sprints.create", "Create Sprint")}
        </Button>
      </div>

      {/* Sprint Cards */}
      {sprints.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("sprints.empty", "No sprints yet. Create your first sprint!")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sprints
            .sort((a, b) => {
              const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2, CANCELLED: 3 };
              return (order[a.status] ?? 4) - (order[b.status] ?? 4);
            })
            .map(sprint => {
              const colors = STATUS_COLORS[sprint.status] || STATUS_COLORS.PLANNED;

              return (
                <div key={sprint.id} className={`rounded-lg border border-border ${colors.bg} p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        <h3 className="font-semibold text-foreground">{sprint.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.text} bg-white/50 dark:bg-black/20`}>
                          {sprint.status}
                        </span>
                      </div>

                      {sprint.goal && (
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> {sprint.goal}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {sprint.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sprint.startDate).toLocaleDateString()}
                          </span>
                        )}
                        {sprint.endDate && (
                          <span className="flex items-center gap-1">
                            → {new Date(sprint.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4">
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
              );
            })}
        </div>
      )}

      {/* Create/Edit Modal */}
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
