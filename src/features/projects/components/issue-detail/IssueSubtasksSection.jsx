import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { issueService } from "@/features/projects/api/issueService";
import ChildIssueRow from "./ChildIssueRow";
import CollapsibleSection from "./CollapsibleSection";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

const IssueSubtasksSection = forwardRef(({
  projectId,
  issueId,
  issueTypes,
  issuePriorities,
  workflowStatuses,
  members,
  onOpenDetail,
  collapsed,
  onToggle,
  onChildrenCountChange
}, ref) => {
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const loadChildren = async () => {
    try {
      setLoadingChildren(true);
      const d = await issueService.getChildren(projectId, issueId);
      const arr = Array.isArray(d) ? d : [];
      setChildren(arr);
      onChildrenCountChange?.(arr.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    if (issueId && projectId) loadChildren();
  }, [issueId, projectId]);

  useImperativeHandle(ref, () => ({
    triggerAdd: () => setAddingSubtask(true)
  }));

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    const subtaskType = issueTypes.find(it => /subtask/i.test(it.name)) || issueTypes[issueTypes.length - 1];
    try {
      await issueService.createIssue(projectId, { title: subtaskTitle.trim(), issueTypeId: subtaskType?.id, parentId: issueId });
      setSubtaskTitle(""); setAddingSubtask(false); await loadChildren();
    } catch (e) {
      toast.error(e?.message || "Error creating subtask");
    }
  };

  const doneChildren = children.filter(c => {
    const s = workflowStatuses.find(s => s.id === c.statusId);
    return s && /done|complet|close|resolv/.test(s.name.toLowerCase());
  }).length;
  const progress = children.length ? Math.round((doneChildren / children.length) * 100) : 0;

  if (!loadingChildren && children.length === 0 && !addingSubtask) return null;

  return (
    <div className="mx-5 mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <CollapsibleSection
        title={`Child Issues${children.length ? ` (${children.length})` : ""}`}
        collapsed={collapsed}
        onToggle={onToggle}
        action={
          !addingSubtask && (
            <button onClick={() => setAddingSubtask(true)}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )
        }
      >
        {loadingChildren ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-1.5 flex-1 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              {[1, 2].map((item) => (
                <div key={item} className="grid grid-cols-[1fr_96px_112px_128px] gap-3 border-b border-border/50 p-2 last:border-0">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
        {/* Progress bar */}
        {children.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
          </div>
        )}
        {/* Subtask table */}
        <div className="overflow-x-auto mb-2">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-border bg-muted/30">
                <th className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Work</th>
                <th className="px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Priority</th>
                <th className="px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Assignee</th>
                <th className="px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {children.map(child => (
                <ChildIssueRow
                  key={child.id}
                  child={child}
                  issueTypes={issueTypes}
                  issuePriorities={issuePriorities}
                  workflowStatuses={workflowStatuses}
                  members={members}
                  projectId={projectId}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </tbody>
          </table>
        </div>
        {/* Inline add subtask form */}
        {addingSubtask && (
          <div className="flex gap-2 items-center mt-2">
            <input
              value={subtaskTitle}
              onChange={e => setSubtaskTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddSubtask(); if (e.key === "Escape") { setAddingSubtask(false); setSubtaskTitle(""); } }}
              placeholder="Subtask title..."
              className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              autoFocus
            />
            <Button size="sm" onClick={handleAddSubtask} disabled={!subtaskTitle.trim()}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddingSubtask(false); setSubtaskTitle(""); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
          </>
        )}
      </CollapsibleSection>
    </div>
  );
});

export default IssueSubtasksSection;
