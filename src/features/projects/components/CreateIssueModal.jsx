import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import AssigneeSelect from "@/components/ui/AssigneeSelect";
import TypeSelect from "@/components/ui/TypeSelect";
import PrioritySelect from "@/components/ui/PrioritySelect";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { documentService } from "@/features/projects/api/documentService";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Paperclip, Trash2, Loader2, File, Upload } from "lucide-react";
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
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef(null);

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
      setAttachments([]);
    }
  }, [open, defaultSprintId, defaultStatusId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    e.target.value = "";
    const newAttachments = [...attachments];

    for (const file of files) {
      const tempId = `temp-${Date.now()}-${file.name}`;
      const tempAttachment = {
        tempId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        progress: 0,
        status: "uploading",
      };

      newAttachments.push(tempAttachment);
      setAttachments([...newAttachments]);

      try {
        const response = await documentService.uploadProjectDocument(projectId, file);
        const index = newAttachments.findIndex(att => att.tempId === tempId);
        if (index !== -1) {
          newAttachments[index] = {
            fileId: response.id,
            fileName: response.fileName,
            fileUrl: response.downloadUrl || "",
            fileType: response.fileType,
            fileSize: response.fileSize,
            status: "success",
          };
          setAttachments([...newAttachments]);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        const index = newAttachments.findIndex(att => att.tempId === tempId);
        if (index !== -1) {
          newAttachments[index].status = "error";
          setAttachments([...newAttachments]);
        }
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
        attachments: attachments
          .filter(att => att.status === "success")
          .map(att => ({
            fileId: att.fileId,
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            fileSize: att.fileSize,
          })),
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
          <TypeSelect
            issueTypes={issueTypes}
            value={formData.issueTypeId}
            onChange={e => handleChange("issueTypeId", e)}
            placeholder={t("issues.form.selectType", "Select type")}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.priority", "Priority")}
          </label>
          <PrioritySelect
            issuePriorities={issuePriorities}
            value={formData.priorityId}
            onChange={e => handleChange("priorityId", e)}
            placeholder={t("issues.form.selectPriority", "Select priority")}
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("issues.form.assignee", "Assignee")}
          </label>
          <AssigneeSelect
            members={members}
            value={formData.assigneeId}
            onChange={e => handleChange("assigneeId", e)}
            placeholder={t("issues.form.selectAssignee", "Select assignee")}
          />
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

        {/* Attachments - full width */}
        <div className="sm:col-span-2 border-t border-border pt-4">
          <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            {t("issues.form.attachments", "Attachments")}
          </label>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att, idx) => (
              <div
                key={att.fileId || att.tempId || idx}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground group relative max-w-[280px]"
              >
                <File className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate pr-4" title={att.fileName}>
                  {att.fileName}
                </span>

                {att.status === "uploading" ? (
                  <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-primary" />
                ) : (
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted-foreground/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                )}
                {att.status === "error" && (
                  <span className="text-[10px] text-red-500 font-medium shrink-0 ml-1">
                    Failed
                  </span>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {t("issues.form.uploadAttachments", "Upload files")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
