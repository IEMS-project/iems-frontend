import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import IssueHeader from "../components/issue-detail/IssueHeader";
import IssueDescription from "../components/issue-detail/IssueDescription";
import IssueSubtasks from "../components/issue-detail/IssueSubtasks";
import IssueActivity from "../components/issue-detail/IssueActivity";
import IssueSidebar from "../components/issue-detail/IssueSidebar";

export default function IssueDetailPage() {
  const { projectId, issueId } = useParams();
  const navigate = useNavigate();

  const {
    issueTypes,
    issuePriorities,
    workflowStatuses,
    members,
    sprints,
    refreshIssues,
  } = useProject();

  const [issue, setIssue] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  /** Fetch the issue */
  const loadIssue = useCallback(async () => {
    if (!projectId || !issueId) return;
    try {
      setLoadError(null);
      const data = await issueService.getIssueById(projectId, issueId);
      if (!data) throw new Error("Issue not found");
      setIssue(data);
    } catch (e) {
      setLoadError(e?.message || "Failed to load issue");
    } finally {
      setLoading(false);
    }
  }, [projectId, issueId]);

  /** Fetch child issues / subtasks */
  const loadChildren = useCallback(async () => {
    if (!projectId || !issueId) return;
    try {
      const data = await issueService.getChildren(projectId, issueId);
      setChildren(Array.isArray(data) ? data : []);
    } catch (e) {
      // Silently ignore — section simply won't render
      setChildren([]);
    }
  }, [projectId, issueId]);

  useEffect(() => {
    setLoading(true);
    setIssue(null);
    setChildren([]);
    loadIssue();
    loadChildren();
  }, [loadIssue, loadChildren]);

  /** Patch issue fields */
  const handleUpdate = useCallback(
    async (patch) => {
      if (!issue) return;
      setSaving(true);
      try {
        // Optimistic update
        setIssue((prev) => ({ ...prev, ...patch }));

        // Handle sprint specially
        const { sprintId, ...rest } = patch;
        if (Object.keys(rest).length > 0) {
          await issueService.updateIssue(projectId, issueId, rest);
        }
        if (sprintId !== undefined) {
          if (sprintId) {
            await issueService.moveToSprint(projectId, issueId, sprintId);
          } else {
            await issueService.removeFromSprint(projectId, issueId);
          }
        }

        toast.success("Issue updated");
        refreshIssues?.();
        // Reload to get fresh enriched user info (assignee/reporter objects)
        loadIssue();
      } catch (e) {
        // Rollback optimistic update
        setIssue((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(patch).map((k) => [k, issue[k]])) }));
        toast.error(e?.message || "Error updating issue");
      } finally {
        setSaving(false);
      }
    },
    [projectId, issueId, issue, refreshIssues, loadIssue]
  );

  /** Delete issue */
  const handleDelete = useCallback(async () => {
    try {
      await issueService.deleteIssue(projectId, issueId);
      toast.success("Issue deleted");
      refreshIssues?.();
      navigate(`/projects/${projectId}/tasks`);
    } catch (e) {
      toast.error(e?.message || "Error deleting issue");
    }
  }, [projectId, issueId, refreshIssues, navigate]);

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading issue…</span>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (loadError || !issue) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-background gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-muted-foreground">{loadError || "Issue not found"}</p>
        <button
          onClick={() => navigate(`/projects/${projectId}/tasks`)}
          className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
        >
          Back to Issues
        </button>
      </div>
    );
  }

  /* ─── Main layout ─── */
  return (
    <div className="flex -m-4 h-[calc(100vh-7.75rem)] overflow-hidden bg-background">
      {/* ══ LEFT — independent scroll ══ */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-5 space-y-5">
          {/* Header: title, key, status, actions */}
          <IssueHeader
            issue={issue}
            issueTypes={issueTypes}
            issuePriorities={issuePriorities}
            workflowStatuses={workflowStatuses}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            saving={saving}
          />

          {/* Description */}
          <IssueDescription
            description={issue.description}
            onSave={(description) => handleUpdate({ description })}
          />

          {/* Subtasks / Child Issues (rendered only if children.length > 0) */}
          <IssueSubtasks
            subtasks={children}
            issueTypes={issueTypes}
            issuePriorities={issuePriorities}
            workflowStatuses={workflowStatuses}
            members={members}
            projectId={projectId}
            onRefresh={loadChildren}
          />

          {/* Activity: comments + history */}
          <IssueActivity
            projectId={projectId}
            issueId={issueId}
            members={members}
          />
        </div>
      </div>

      {/* ══ RIGHT — independent scroll sidebar ══ */}
      <IssueSidebar
        issue={issue}
        issueTypes={issueTypes}
        issuePriorities={issuePriorities}
        workflowStatuses={workflowStatuses}
        members={members}
        sprints={sprints}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
