import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import FibonacciStoryPointInput, { isFibonacci } from "./FibonacciStoryPointInput";

export default function CreateIssueModal({
  open,
  onClose,
  onCreated,
  defaultSprintId = null,
  defaultStatusId = null,
}) {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { issueTypes, issuePriorities, members, sprints, issues, workflowStatuses, refreshIssues } = useProject();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issueTypeId: "",
    priorityId: "",
    assigneeId: "",
    sprintId: defaultSprintId || "",
    parentId: "",
    storyPoints: "",
  });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        issueTypeId: "",
        priorityId: "",
        assigneeId: "",
        sprintId: defaultSprintId || "",
        parentId: "",
        storyPoints: "",
      });
    }
  }, [open, defaultSprintId, defaultStatusId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Label for the pre-selected status column
  const statusLabel = defaultStatusId
    ? workflowStatuses.find(s => s.id === defaultStatusId)?.name || ""
    : null;

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.warning(t("issues.messages.titleRequired", "Please enter issue title"));
      return;
    }
    if (formData.storyPoints !== "" && !isFibonacci(formData.storyPoints)) {
      toast.warning("Story Points must be a Fibonacci number (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        issueTypeId: formData.issueTypeId || undefined,
        priorityId: formData.priorityId || undefined,
        assigneeId: formData.assigneeId || undefined,
        sprintId: formData.sprintId || undefined,
        parentId: formData.parentId || undefined,
        storyPoints: formData.storyPoints ? parseInt(formData.storyPoints, 10) : undefined,
        statusId: defaultStatusId || undefined,
      };

      await issueService.createIssue(projectId, payload);
      toast.success(t("issues.messages.created", "Issue created successfully"));
      await refreshIssues();
      if (onCreated) {
        await onCreated();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error creating issue:", error);
      toast.error(error?.message || t("ui.common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("issues.createIssue", "Create Issue")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("ui.common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t("ui.common.loading") : t("ui.common.save")}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title - full width */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.title", "Title")} *
          </label>
          <Input
            value={formData.title}
            onChange={e => handleChange("title", e.target.value)}
            placeholder={t("issues.form.titlePlaceholder", "Enter issue title")}
            className="w-full"
          />
        </div>

        {/* Status (pre-selected from column, readonly) */}
        {statusLabel && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("issues.form.status", "Status")}
            </label>
            <div className="w-full rounded-md border border-border bg-muted/50 text-foreground p-2 text-sm">
              {statusLabel}
            </div>
          </div>
        )}

        {/* Issue Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.type", "Type")}
          </label>
          <select
            value={formData.issueTypeId}
            onChange={e => handleChange("issueTypeId", e.target.value)}
            className="w-full rounded-md border border-border bg-background text-foreground p-2 text-sm"
          >
            <option value="">{t("issues.form.selectType", "Select type")}</option>
            {issueTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.priority", "Priority")}
          </label>
          <select
            value={formData.priorityId}
            onChange={e => handleChange("priorityId", e.target.value)}
            className="w-full rounded-md border border-border bg-background text-foreground p-2 text-sm"
          >
            <option value="">{t("issues.form.selectPriority", "Select priority")}</option>
            {issuePriorities.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.assignee", "Assignee")}
          </label>
          <select
            value={formData.assigneeId}
            onChange={e => handleChange("assigneeId", e.target.value)}
            className="w-full rounded-md border border-border bg-background text-foreground p-2 text-sm"
          >
            <option value="">{t("issues.form.selectAssignee", "Select assignee")}</option>
            {members.map(m => (
              <option key={m.userId} value={m.userId}>
                {m.userName
                  ? `${m.userName}${m.userEmail ? ` (${m.userEmail})` : ""}`
                  : m.userEmail || String(m.userId)}
              </option>
            ))}
          </select>
        </div>

        {/* Sprint */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.sprint", "Sprint")}
          </label>
          <select
            value={formData.sprintId}
            onChange={e => handleChange("sprintId", e.target.value)}
            className="w-full rounded-md border border-border bg-background text-foreground p-2 text-sm"
          >
            <option value="">{t("issues.form.backlog", "Backlog")}</option>
            {sprints
              .filter(s => s.status === "PLANNED" || s.status === "ACTIVE")
              .map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
        </div>

        {/* Story Points */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.storyPoints", "Story Points")}
          </label>
          <FibonacciStoryPointInput
            value={formData.storyPoints}
            onChange={v => handleChange("storyPoints", v)}
            className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* Parent Issue */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.parentIssue", "Parent Issue")}
          </label>
          <select
            value={formData.parentId}
            onChange={e => handleChange("parentId", e.target.value)}
            className="w-full rounded-md border border-border bg-background text-foreground p-2 text-sm"
          >
            <option value="">{t("issues.form.noParent", "None")}</option>
            {issues.filter(i => !i.parentId).map(i => (
              <option key={i.id} value={i.id}>{i.issueKey} - {i.title}</option>
            ))}
          </select>
        </div>

        {/* Description - full width */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.description", "Description")}
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={v => handleChange("description", v)}
            placeholder={t("issues.form.descriptionPlaceholder", "Enter description")}
          />
        </div>
      </div>
    </Modal>
  );
}
