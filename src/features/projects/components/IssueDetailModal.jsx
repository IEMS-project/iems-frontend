import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/button";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { documentService } from "@/features/projects/api/documentService";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "./IssueCard";
import { isFibonacci } from "./FibonacciStoryPointInput";
import { validateDates } from "@/features/projects/utils/dateValidation";
import { Trash2, Save, MoreHorizontal, X, Paperclip, File, Upload, Loader2 } from "lucide-react";
import { getStatusStyle } from "../utils/issueStyles";
import IssueSidebar from "./issue-detail/IssueSidebar";
import IssueSubtasksSection from "./issue-detail/IssueSubtasksSection";
import IssueActivitySection from "./issue-detail/IssueActivitySection";
import CollapsibleSection from "./issue-detail/CollapsibleSection";
import {
  ISSUE_TITLE_MAX_LENGTH,
  firstIssueValidationMessage,
  normalizeRichText,
  validateIssueForm,
} from "@/features/projects/utils/issueValidation";

function initForm(issue) {
  const resolvedAssigneeId =
    issue?.assigneeId ||
    issue?.assignee?.accountId ||
    issue?.assignee?.userId ||
    issue?.assignee?.user?.accountId ||
    issue?.assignee?.user?.id ||
    issue?.assignee?.id ||
    "";

  return {
    title: issue?.title || "",
    description: issue?.description || "",
    issueTypeId: issue?.issueTypeId || "",
    statusId: issue?.statusId || "",
    priorityId: issue?.priorityId || "",
    assigneeId: resolvedAssigneeId,
    sprintId: issue?.sprintId || "",
    storyPoints: issue?.storyPoints ?? "",
    dueDate: issue?.dueDate || "",
  };
}

export default function IssueDetailModal({
  open,
  onClose,
  issue,
  onUpdate,
  onDelete,
  targetCommentId,
  onOptimisticUpdate,
  onRollbackUpdate,
}) {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const {
    issueTypes,
    issuePriorities,
    workflowStatuses,
    members,
    sprints,
    refreshIssues,
    updateIssueInCache,
    rollbackIssueInCache,
  } = useProject();

  const [form, setForm] = useState(() => initForm(issue));
  const [attachments, setAttachments] = useState(() => issue?.attachments || []);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Subtasks and Activity state
  const [subModalIssue, setSubModalIssue] = useState(null);
  const [childrenCount, setChildrenCount] = useState(0);
  const subtasksRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Collapse state
  const [collapsed, setCollapsed] = useState({ description: false, subtasks: false, activity: false, attachments: false });

  // More actions dropdown
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    setForm(initForm(issue));
    setAttachments(issue?.attachments || []);
    setErrors({});
    setCollapsed({ description: false, subtasks: false, activity: false, attachments: false });
  }, [issue?.id, open]);

  // Close more menu on outside click
  useEffect(() => {
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setShowMoreMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const handleDownloadAttachment = async (att) => {
    try {
      const data = await documentService.getDocumentDownloadLink(projectId, att.fileId);
      if (data?.downloadUrl) {
        window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error("No download link received");
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download attachment");
    }
  };

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const resolveIssueAssigneeId = (issueData) =>
    issueData?.assigneeId ||
    issueData?.assignee?.accountId ||
    issueData?.assignee?.userId ||
    issueData?.assignee?.user?.accountId ||
    issueData?.assignee?.user?.id ||
    issueData?.assignee?.id ||
    "";

  const initialAssigneeId = resolveIssueAssigneeId(issue);

  const attachmentsChanged = (() => {
    const existing = issue?.attachments || [];
    if (existing.length !== attachments.length) return true;
    const existingIds = new Set(existing.map(a => a.fileId));
    return attachments.some(a => !existingIds.has(a.fileId));
  })();

  const isDirty = issue && (
    form.title !== (issue.title || "") ||
    form.description !== (issue.description || "") ||
    form.issueTypeId !== (issue.issueTypeId || "") ||
    form.statusId !== (issue.statusId || "") ||
    form.priorityId !== (issue.priorityId || "") ||
    String(form.assigneeId || "") !== String(initialAssigneeId || "") ||
    form.sprintId !== (issue.sprintId || "") ||
    String(form.storyPoints) !== String(issue.storyPoints ?? "") ||
    form.dueDate !== (issue.dueDate || "") ||
    attachmentsChanged
  );

  const handleSave = async () => {
    if (!isDirty) return;
    const validationErrors = validateIssueForm(form, { requireIssueType: true });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning(firstIssueValidationMessage(validationErrors));
      return;
    }
    if (form.storyPoints !== "" && form.storyPoints !== null && !isFibonacci(form.storyPoints)) {
      toast.warning("Story Points must be a Fibonacci number (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)");
      return;
    }
    const dueDateError = validateDates({ startDate: form.dueDate, createdAt: issue?.createdAt });
    if (dueDateError) { toast.warning(dueDateError); return; }

    const patch = {};
    const description = normalizeRichText(form.description);
    if (form.title !== (issue.title || "")) patch.title = form.title.trim();
    if (description !== (issue.description || "")) patch.description = description || null;
    if (form.issueTypeId !== (issue.issueTypeId || "")) patch.issueTypeId = form.issueTypeId;
    if (form.statusId !== (issue.statusId || "")) patch.statusId = form.statusId;
    if (form.priorityId !== (issue.priorityId || "")) patch.priorityId = form.priorityId || null;
    if (String(form.assigneeId || "") !== String(initialAssigneeId || "")) patch.assigneeId = form.assigneeId || null;
    if (String(form.storyPoints) !== String(issue.storyPoints ?? "")) {
      patch.storyPoints = form.storyPoints === "" ? null : parseInt(form.storyPoints, 10);
    }
    if (form.dueDate !== (issue.dueDate || "")) patch.dueDate = form.dueDate || null;
    if (attachmentsChanged) {
      patch.attachments = attachments.map(att => ({
        fileId: att.fileId,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize,
      }));
    }

    const nextSprintId = form.sprintId || null;
    const sprintChanged = String(nextSprintId || "") !== String(issue.sprintId || "");
    const optimisticIssue = { ...issue, ...patch, sprintId: nextSprintId, attachments: attachments };
    const previousIssue = issue;

    setSaving(true);
    updateIssueInCache(optimisticIssue);
    onOptimisticUpdate?.(optimisticIssue);
    setForm(initForm(optimisticIssue));
    setAttachments(optimisticIssue.attachments || []);
    try {

      let savedIssue = optimisticIssue;
      if (Object.keys(patch).length > 0) {
        savedIssue = await issueService.updateIssue(projectId, issue.id, patch);
        updateIssueInCache({ ...optimisticIssue, ...savedIssue });
      }

      if (sprintChanged) {
        const movedIssue = form.sprintId ? await issueService.moveToSprint(projectId, issue.id, form.sprintId)
          : await issueService.removeFromSprint(projectId, issue.id);
        updateIssueInCache({ ...savedIssue, ...movedIssue, sprintId: nextSprintId });
      }
      toast.success("Issue updated");
      setRefreshKey(k => k + 1);
      onUpdate?.();
    } catch (e) {
      rollbackIssueInCache(previousIssue);
      onRollbackUpdate?.(previousIssue);
      setForm(initForm(previousIssue));
      toast.error(e?.message || "Error saving");
      refreshIssues();
    }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await issueService.deleteIssue(projectId, issue.id);
      toast.success("Issue deleted");
      await refreshIssues(); onDelete?.(); onClose();
    } catch (e) { toast.error(e?.message || "Error deleting"); }
  };

  const resolveMemberId = (member) =>
    member?.accountId ||
    member?.userId ||
    member?.user?.accountId ||
    member?.user?.id ||
    member?.id;

  const getAuthorName = (userId) => {
    if (!userId) return null;
    const m = members.find(m => String(resolveMemberId(m) || "") === String(userId || ""));
    return m?.fullName || m?.userName || m?.name || m?.email || null;
  };

  if (!issue) return null;

  const currentStatus = workflowStatuses.find(s => s.id === form.statusId);
  const currentType = issueTypes.find(it => it.id === form.issueTypeId);
  const typeName = currentType?.name || "TASK";
  const TypeIcon = getIssueTypeIcon(typeName);
  const typeColor = getIssueTypeColor(typeName);
  const priorityObj = issuePriorities.find(p => p.id === form.priorityId);
  const { icon: PriorityIcon, color: prioColor } = getPriorityIcon(priorityObj?.name);
  const assigneeName = form.assigneeId
    ? (getAuthorName(form.assigneeId) || issue?.assignee?.name || issue?.assignee?.email)
    : "";
  const reporterName = getAuthorName(issue.reporterId) || issue?.reporter?.name || issue?.reporter?.email;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        className="!max-w-[1180px] !h-[92vh] !max-h-[92vh] !rounded-2xl overflow-hidden"
        contentClassName="overflow-hidden p-0 bg-background"
        title={
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <TypeIcon className={`h-3.5 w-3.5 ${typeColor}`} />
                    <span className="font-mono">{issue.issueKey}</span>
                  </span>
                  <select
                    value={form.statusId}
                    onChange={e => set("statusId", e.target.value)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${getStatusStyle(currentStatus?.name)}`}
                  >
                    {workflowStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    <TypeIcon className={`h-3.5 w-3.5 ${typeColor}`} />{typeName}
                  </span>
                  {priorityObj && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                      <PriorityIcon className={`h-3.5 w-3.5 ${prioColor}`} />{priorityObj.name}
                    </span>
                  )}
                </div>
                <input
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                  className="w-full rounded-lg border border-transparent bg-transparent py-1 text-2xl font-semibold leading-tight text-foreground outline-none transition-colors hover:border-border hover:bg-muted/30 focus:border-primary/40 focus:bg-background focus:px-3"
                  placeholder="Issue title"
                  maxLength={ISSUE_TITLE_MAX_LENGTH}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setShowMoreMenu(v => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-10 z-20 min-w-[150px] rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-xl">
                      <button onClick={() => { setShowMoreMenu(false); handleDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-muted">
                        <Trash2 className="h-3.5 w-3.5" /> Delete issue
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {isDirty ? "You have unsaved changes" : "No pending changes"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
              <Button size="sm" onClick={handleSave} disabled={!isDirty || saving} className="min-w-[80px]">
                <Save className="w-4 h-4 mr-1" />{saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="h-full flex bg-background">
          {/* ════ LEFT COLUMN ════ */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 border-r border-border">

            {/* Issue header — fixed */}
            <div className="hidden">
              <div className="flex items-start justify-between gap-3 mb-3">
                <input
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                  className="flex-1 text-lg font-semibold bg-transparent text-foreground border-0 border-b-2 border-transparent hover:border-border focus:border-blue-500 focus:outline-none py-0.5 transition-colors leading-snug"
                  placeholder="Issue title"
                />
                <div className="relative shrink-0">
                  <button onClick={() => setShowMoreMenu(v => !v)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                      <button onClick={() => { setShowMoreMenu(false); handleDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete issue
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status + meta pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={form.statusId}
                  onChange={e => set("statusId", e.target.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${getStatusStyle(currentStatus?.name)}`}
                >
                  {workflowStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1 border border-border">
                  <TypeIcon className={`w-3 h-3 ${typeColor}`} />{typeName}
                </span>
                {priorityObj && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1 border border-border">
                    <PriorityIcon className={`w-3 h-3 ${prioColor}`} />{priorityObj.name}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable main content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Description */}
              <div className="m-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <CollapsibleSection
                  title="Description"
                  collapsed={collapsed.description}
                  onToggle={() => setCollapsed(p => ({ ...p, description: !p.description }))}
                >
                  <RichTextEditor
                    value={form.description}
                    onChange={v => set("description", v)}
                    placeholder="Add a description..."
                  />
                  {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
                </CollapsibleSection>
              </div>

              {/* Attachments */}
              <div className="m-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <CollapsibleSection
                  title="Attachments"
                  collapsed={collapsed.attachments}
                  onToggle={() => setCollapsed(p => ({ ...p, attachments: !p.attachments }))}
                >
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
                        key={att.id || att.fileId || att.tempId || idx}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground group relative max-w-[280px]"
                      >
                        <File className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        {att.status === "success" || !att.status ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att)}
                            className="truncate text-left pr-4 hover:underline hover:text-primary font-medium"
                            title={att.fileName}
                          >
                            {att.fileName}
                          </button>
                        ) : (
                          <span className="truncate pr-4 font-medium" title={att.fileName}>
                            {att.fileName}
                          </span>
                        )}

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
                    Upload files
                  </Button>
                </CollapsibleSection>
              </div>

              {/* Subtasks */}
              <IssueSubtasksSection
                ref={subtasksRef}
                projectId={projectId}
                issueId={issue.id}
                issueTypes={issueTypes}
                issuePriorities={issuePriorities}
                workflowStatuses={workflowStatuses}
                members={members}
                onOpenDetail={setSubModalIssue}
                collapsed={collapsed.subtasks}
                onToggle={() => setCollapsed(p => ({ ...p, subtasks: !p.subtasks }))}
                onChildrenCountChange={setChildrenCount}
              />

              {/* Activity */}
              <IssueActivitySection
                key={refreshKey}
                projectId={projectId}
                issueId={issue.id}
                targetCommentId={targetCommentId}
                members={members}
                workflowStatuses={workflowStatuses}
                collapsed={collapsed.activity}
                onToggle={() => setCollapsed(p => ({ ...p, activity: !p.activity }))}
                hasChildren={childrenCount > 0}
                onAddChild={() => subtasksRef.current?.triggerAdd()}
              />
            </div>
          </div>

          {/* ════ RIGHT SIDEBAR ════ */}
          <div className="w-80 shrink-0 overflow-y-auto overflow-x-hidden bg-muted/40">
            <IssueSidebar
              form={form}
              onChangeField={set}
              issue={issue}
              members={members}
              issuePriorities={issuePriorities}
              issueTypes={issueTypes}
              sprints={sprints}
              assigneeName={assigneeName}
              reporterName={reporterName}
            />
          </div>
        </div>
      </Modal>

      {/* Nested modal for subtask detail */}
      {subModalIssue && (
        <IssueDetailModal
          open={!!subModalIssue}
          onClose={() => setSubModalIssue(null)}
          issue={subModalIssue}
          targetCommentId={targetCommentId}
          onUpdate={() => {
            setRefreshKey(k => k + 1);
            setSubModalIssue(null);
          }}
          onDelete={() => {
            setRefreshKey(k => k + 1);
            setSubModalIssue(null);
          }}
        />
      )}
    </>
  );
}
