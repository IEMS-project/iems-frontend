import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "./IssueCard";
import { isFibonacci } from "./FibonacciStoryPointInput";
import { validateDates } from "@/features/projects/utils/dateValidation";
import { Trash2, Save, MoreHorizontal, X } from "lucide-react";
import { getStatusStyle } from "../utils/issueStyles";
import IssueSidebar from "./issue-detail/IssueSidebar";
import IssueSubtasksSection from "./issue-detail/IssueSubtasksSection";
import IssueActivitySection from "./issue-detail/IssueActivitySection";
import CollapsibleSection from "./issue-detail/CollapsibleSection";

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
  const [saving, setSaving] = useState(false);

  // Subtasks and Activity state
  const [subModalIssue, setSubModalIssue] = useState(null);
  const [childrenCount, setChildrenCount] = useState(0);
  const subtasksRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Collapse state
  const [collapsed, setCollapsed] = useState({ description: false, subtasks: false, activity: false });

  // More actions dropdown
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    setForm(initForm(issue));
    setCollapsed({ description: false, subtasks: false, activity: false });
  }, [issue?.id, open]);

  // Close more menu on outside click
  useEffect(() => {
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setShowMoreMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const resolveIssueAssigneeId = (issueData) =>
    issueData?.assigneeId ||
    issueData?.assignee?.accountId ||
    issueData?.assignee?.userId ||
    issueData?.assignee?.user?.accountId ||
    issueData?.assignee?.user?.id ||
    issueData?.assignee?.id ||
    "";

  const initialAssigneeId = resolveIssueAssigneeId(issue);

  const isDirty = issue && (
    form.title !== (issue.title || "") ||
    form.description !== (issue.description || "") ||
    form.issueTypeId !== (issue.issueTypeId || "") ||
    form.statusId !== (issue.statusId || "") ||
    form.priorityId !== (issue.priorityId || "") ||
    String(form.assigneeId || "") !== String(initialAssigneeId || "") ||
    form.sprintId !== (issue.sprintId || "") ||
    String(form.storyPoints) !== String(issue.storyPoints ?? "") ||
    form.dueDate !== (issue.dueDate || "")
  );

  const handleSave = async () => {
    if (!isDirty) return;
    if (form.storyPoints !== "" && form.storyPoints !== null && !isFibonacci(form.storyPoints)) {
      toast.warning("Story Points must be a Fibonacci number (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)");
      return;
    }
    const dueDateError = validateDates({ startDate: form.dueDate, createdAt: issue?.createdAt });
    if (dueDateError) { toast.warning(dueDateError); return; }

    const patch = {};
    if (form.title !== (issue.title || "")) patch.title = form.title;
    if (form.description !== (issue.description || "")) patch.description = form.description || null;
    if (form.issueTypeId !== (issue.issueTypeId || "")) patch.issueTypeId = form.issueTypeId;
    if (form.statusId !== (issue.statusId || "")) patch.statusId = form.statusId;
    if (form.priorityId !== (issue.priorityId || "")) patch.priorityId = form.priorityId || null;
    if (String(form.assigneeId || "") !== String(initialAssigneeId || "")) patch.assigneeId = form.assigneeId || null;
    if (String(form.storyPoints) !== String(issue.storyPoints ?? "")) {
      patch.storyPoints = form.storyPoints === "" ? null : parseInt(form.storyPoints, 10);
    }
    if (form.dueDate !== (issue.dueDate || "")) patch.dueDate = form.dueDate || null;

    const nextSprintId = form.sprintId || null;
    const sprintChanged = String(nextSprintId || "") !== String(issue.sprintId || "");
    const optimisticIssue = { ...issue, ...patch, sprintId: nextSprintId };
    const previousIssue = issue;

    setSaving(true);
    updateIssueInCache(optimisticIssue);
    onOptimisticUpdate?.(optimisticIssue);
    setForm(initForm(optimisticIssue));
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
                />
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
