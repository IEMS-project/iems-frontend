import React, { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from "@dnd-kit/core";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import Avatar from "@/components/ui/Avatar";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "./IssueCard";
import CreateIssueModal from "./CreateIssueModal";
import IssueDetailModal from "./IssueDetailModal";
import IssueFiltersDropdown from "./shared/IssueFiltersDropdown";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { sprintService } from "@/features/projects/api/sprintService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Plus, ChevronDown, ChevronRight, Play, CheckCircle2, Search,
  Layers, GripVertical, SlidersHorizontal, X,
} from "lucide-react";

const SPRINT_STATUS_COLORS = {
  PLANNED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const resolveIssueAssigneeId = (issue) =>
  issue?.assigneeId ||
  issue?.assignee?.accountId ||
  issue?.assignee?.userId ||
  issue?.assignee?.user?.accountId ||
  issue?.assignee?.user?.id ||
  issue?.assignee?.id;

// ── Droppable zone with blue-ring highlight on hover ────────────
function DroppableZone({ id, isDragging, children, className, disabled }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return (
    <div
      ref={disabled ? undefined : setNodeRef}
      className={cn(
        "transition-all duration-150",
        !disabled && isOver && "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-inset ring-blue-400",
        !disabled && isDragging && !isOver && "border-2 border-dashed border-primary/20 bg-primary/5 m-1 rounded-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Draggable wrapper for each issue row ────────────────────────
function DraggableIssueRow({ issue, containerId, issueTypes, issuePriorities, members, onClick, sprints, onMoveToSprint, isSelected, onToggleSelect, isGroupDragging }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.id,
    data: { sourceContainer: containerId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex items-center gap-1 px-3 py-2 hover:bg-muted/30 transition-colors",
        isDragging && "opacity-30",
        isGroupDragging && "opacity-30 transition-opacity",
        isSelected && "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-300 dark:ring-blue-700",
      )}
      onClickCapture={e => {
        if (e.ctrlKey || e.metaKey) {
          e.stopPropagation();
          onToggleSelect?.();
        }
      }}
    >
      {/* Drag handle — visible on row hover */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0 touch-none"
        onClick={e => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <IssueRow
        issue={issue}
        issueTypes={issueTypes}
        issuePriorities={issuePriorities}
        members={members}
        onClick={onClick}
        sprints={sprints}
        onMoveToSprint={onMoveToSprint}
      />
    </div>
  );
}

export default function BacklogTab() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const currentUserId = userProfile?.id || userProfile?.userId;

  const {
    issues, backlogIssues, sprints, issueTypes, issuePriorities,
    members, workflowStatuses, issuesLoading, sprintsLoading, refreshIssues, refreshSprints,
  } = useProject();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSprintId, setCreateSprintId] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [expandedSprints, setExpandedSprints] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterBtnRef = useRef(null);
  const [activeIssue, setActiveIssue] = useState(null);

  // Multi-select
  const [selectedIssueIds, setSelectedIssueIds] = useState(new Set());

  // Local copies for optimistic updates — synced from context when not mid-operation
  const [localIssues, setLocalIssues] = useState(issues);
  const [localBacklog, setLocalBacklog] = useState(backlogIssues);
  React.useEffect(() => { setLocalIssues(issues); }, [issues]);
  React.useEffect(() => { setLocalBacklog(backlogIssues); }, [backlogIssues]);

  React.useEffect(() => {
    const issueId = searchParams.get("issueId");
    if (!issueId || !projectId) return;

    const localIssue = [...localIssues, ...localBacklog].find((issue) => String(issue.id) === String(issueId));
    if (localIssue) {
      setSelectedIssue(localIssue);
      return;
    }

    let cancelled = false;
    issueService.getIssueById(projectId, issueId)
      .then((issue) => {
        if (!cancelled && issue) setSelectedIssue(issue);
      })
      .catch((error) => toast.error(error?.message || "Failed to load issue"));

    return () => { cancelled = true; };
  }, [searchParams, projectId, localIssues, localBacklog]);

  const closeSelectedIssue = () => {
    setSelectedIssue(null);
    if (searchParams.has("issueId")) {
      const next = new URLSearchParams(searchParams);
      next.delete("issueId");
      setSearchParams(next, { replace: true });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Auto-expand active/planned sprints on load
  React.useEffect(() => {
    const ids = sprints
      .filter(s => s.status === "ACTIVE" || s.status === "PLANNED")
      .map(s => s.id);
    setExpandedSprints(new Set(ids));
  }, [sprints]);

  // Group issues by sprint (using local optimistic state)
  const sprintIssuesMap = useMemo(() => {
    const map = {};
    sprints.forEach(s => { map[s.id] = []; });
    localIssues.forEach(issue => {
      if (issue.sprintId && map[issue.sprintId]) {
        map[issue.sprintId].push(issue);
      }
    });
    return map;
  }, [localIssues, sprints]);

  // Flat map for drag overlay lookup
  const allIssuesMap = useMemo(() => {
    const map = {};
    [...localIssues, ...localBacklog].forEach(i => { map[i.id] = i; });
    return map;
  }, [localIssues, localBacklog]);

  const filterIssues = (list) => {
    let out = list;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      out = out.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.issueKey?.toLowerCase().includes(q)
      );
    }
    if (filterStatus) out = out.filter((i) => String(i.statusId || "") === String(filterStatus));
    if (filterType) out = out.filter((i) => String(i.issueTypeId || "") === String(filterType));
    if (filterPriority) out = out.filter((i) => String(i.priorityId || "") === String(filterPriority));
    if (filterAssignee) out = out.filter((i) => String(resolveIssueAssigneeId(i) || "") === String(filterAssignee));
    return out;
  };

  const activeFilterCount = [filterStatus, filterType, filterPriority, filterAssignee].filter(Boolean).length;
  const hasActiveFilters = Boolean(searchQuery?.trim()) || activeFilterCount > 0;
  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    setFilterType("");
    setFilterPriority("");
    setFilterAssignee("");
  };

  const toggleSprint = (sprintId) => {
    setExpandedSprints(prev => {
      const next = new Set(prev);
      next.has(sprintId) ? next.delete(sprintId) : next.add(sprintId);
      return next;
    });
  };

  // ── API handlers ────────────────────────────────────────────────

  const handleMoveToSprint = async (issueId, sprintId) => {
    // Snapshot for revert
    const prevIssues = localIssues;
    const prevBacklog = localBacklog;

    // Optimistic update
    if (sprintId) {
      const issue =
        localBacklog.find(i => i.id === issueId) ||
        localIssues.find(i => i.id === issueId);
      if (issue) {
        setLocalBacklog(prev => prev.filter(i => i.id !== issueId));
        setLocalIssues(prev => [
          ...prev.filter(i => i.id !== issueId),
          { ...issue, sprintId },
        ]);
      }
    } else {
      const issue = localIssues.find(i => i.id === issueId);
      if (issue) {
        setLocalIssues(prev => prev.filter(i => i.id !== issueId));
        setLocalBacklog(prev => [...prev, { ...issue, sprintId: null }]);
      }
    }

    // Background API call — no refresh, only revert on error
    try {
      if (sprintId) {
        await issueService.moveToSprint(projectId, issueId, sprintId);
      } else {
        await issueService.removeFromSprint(projectId, issueId);
      }
    } catch (e) {
      setLocalIssues(prevIssues);
      setLocalBacklog(prevBacklog);
      toast.error(e?.message || "Error moving issue");
    }
  };

  const handleStartSprint = async (sprint) => {
    try {
      await sprintService.startSprint(projectId, sprint.id);
      toast.success(t("sprints.messages.started", "Sprint started"));
      await refreshSprints();
    } catch (e) {
      toast.error(e?.message || "Error starting sprint");
    }
  };

  const handleCompleteSprint = async (sprint) => {
    try {
      await sprintService.completeSprint(projectId, sprint.id);
      toast.success(t("sprints.messages.completed", "Sprint completed"));
      await Promise.all([refreshSprints(), refreshIssues()]);
    } catch (e) {
      toast.error(e?.message || "Error completing sprint");
    }
  };

  // ── Multi-select ─────────────────────────────────────────────────
  const toggleSelectIssue = (issueId) => {
    setSelectedIssueIds(prev => {
      const next = new Set(prev);
      next.has(issueId) ? next.delete(issueId) : next.add(issueId);
      return next;
    });
  };

  React.useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") setSelectedIssueIds(new Set()); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── DnD handlers ────────────────────────────────────────────────

  const handleDragStart = ({ active }) => {
    setActiveIssue(allIssuesMap[active.id] || null);
    // Auto-expand only ACTIVE/PLANNED sprints so droppable zones are visible
    setExpandedSprints(prev => {
      const next = new Set(prev);
      sprints
        .filter(s => s.status === "ACTIVE" || s.status === "PLANNED")
        .forEach(s => next.add(s.id));
      return next;
    });
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveIssue(null);
    if (!over) return;

    const sourceContainer = active.data.current?.sourceContainer;
    const destContainer = String(over.id);
    if (sourceContainer === destContainer) return;

    const isBacklog = destContainer === "backlog";
    const sprintId = !isBacklog && destContainer.startsWith("sprint-")
      ? destContainer.slice(7) : null;
    if (!isBacklog && !sprintId) return;

    // Block drop into COMPLETED or CANCELLED sprints
    if (sprintId) {
      const destSprint = sprints.find(s => String(s.id) === String(sprintId));
      if (destSprint && (destSprint.status === "COMPLETED" || destSprint.status === "CANCELLED")) {
        return;
      }
    }

    // If dragged issue is part of selection, move ALL selected; otherwise just this one
    const idsToMove = selectedIssueIds.has(active.id)
      ? [...selectedIssueIds]
      : [active.id];

    if (selectedIssueIds.has(active.id)) setSelectedIssueIds(new Set());

    await Promise.all(idsToMove.map(id => handleMoveToSprint(id, isBacklog ? null : sprintId)));
  };

  // ── Loading state ───────────────────────────────────────────────

  if (issuesLoading || sprintsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────

  const sortedSprints = [...sprints].sort((a, b) => {
    const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2, CANCELLED: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/60">
          {/* Search */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("issues.search", "Search issues...")}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick Flat Filters: Assignee Avatars */}
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {members.slice(0, 5).map((member) => {
              const memberId = member.accountId || member.userId || member.id || member?.user?.accountId || member?.user?.id;
              const isSelected = String(filterAssignee) === String(memberId);
              const name = member.fullName || member.userName || member.name || member.email || "Team Member";
              return (
                <button
                  key={memberId}
                  type="button"
                  onClick={() => setFilterAssignee(prev => String(prev) === String(memberId) ? "" : memberId)}
                  className={cn(
                    "relative rounded-full transition-all duration-150 hover:-translate-y-0.5",
                    isSelected ? "ring-2 ring-primary ring-offset-2 scale-105 z-10" : "hover:z-10"
                  )}
                  title={name}
                >
                  <Avatar user={member} name={name} size="xs" className="h-7 w-7 border-2 border-background" />
                </button>
              );
            })}
            {members.length > 5 && (
              <span className="text-xs text-muted-foreground font-semibold pl-2">
                +{members.length - 5}
              </span>
            )}
          </div>

          {/* Quick Filter: "My Issues" button */}
          {currentUserId && (
            <button
              type="button"
              onClick={() => setFilterAssignee(prev => String(prev) === String(currentUserId) ? "" : currentUserId)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md border transition-all duration-150",
                String(filterAssignee) === String(currentUserId)
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("issues.filters.onlyMyIssues", "Only my issues")}
            </button>
          )}

          {/* More Filters Popover */}
          <div className="relative">
            <button
              ref={filterBtnRef}
              type="button"
              onClick={() => setShowFilterDropdown((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-foreground hover:bg-muted transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              <span className={cn(
                "inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-medium",
                activeFilterCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {activeFilterCount}
              </span>
            </button>
            {showFilterDropdown && (
              <IssueFiltersDropdown
                anchorEl={filterBtnRef.current}
                onClose={() => setShowFilterDropdown(false)}
                onClear={clearFilters}
                workflowStatuses={workflowStatuses}
                issueTypes={issueTypes}
                issuePriorities={issuePriorities}
                members={members}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterType={filterType}
                setFilterType={setFilterType}
                filterPriority={filterPriority}
                setFilterPriority={setFilterPriority}
                filterAssignee={filterAssignee}
                setFilterAssignee={setFilterAssignee}
              />
            )}
          </div>

          {/* Active filters labels list */}
          {activeFilterCount > 0 && (
            <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
              {filterStatus && (
                <span className="px-2 py-0.5 rounded bg-muted border border-border text-[10px]">
                  Status: {workflowStatuses.find(s => s.id === filterStatus)?.name}
                </span>
              )}
              {filterType && (
                <span className="px-2 py-0.5 rounded bg-muted border border-border text-[10px]">
                  Type: {issueTypes.find(t => t.id === filterType)?.name}
                </span>
              )}
              {filterPriority && (
                <span className="px-2 py-0.5 rounded bg-muted border border-border text-[10px]">
                  Priority: {issuePriorities.find(p => p.id === filterPriority)?.name}
                </span>
              )}
              {filterAssignee && (
                <span className="px-2 py-0.5 rounded bg-muted border border-border text-[10px]">
                  Assignee: {members.find(m => String(m.accountId || m.userId || m.id || m?.user?.accountId || m?.user?.id) === String(filterAssignee))?.fullName || "Selected"}
                </span>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5" />{t("issues.clearFilters", "Clear")}
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={() => { setCreateSprintId(null); setShowCreateModal(true); }}>
              <Plus className="w-4 h-4 mr-1" /> {t("issues.createIssue", "Create Issue")}
            </Button>
          </div>
        </div>

        {/* Sprint Sections */}
        {sortedSprints.map(sprint => {
          const sprintIssues = filterIssues(sprintIssuesMap[sprint.id] || []);
          const isExpanded = expandedSprints.has(sprint.id);
          const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
          const containerId = `sprint-${sprint.id}`;

          return (
            <div key={sprint.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSprint(sprint.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  }
                  <span className="font-semibold text-foreground">{sprint.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SPRINT_STATUS_COLORS[sprint.status] || SPRINT_STATUS_COLORS.PLANNED}`}>
                    {sprint.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({sprintIssues.length} {t("issues.issues", "issues")} · {totalPoints} {t("issues.points", "pts")})
                  </span>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {sprint.status === "PLANNED" && (
                    <Button size="sm" variant="secondary" onClick={() => handleStartSprint(sprint)}>
                      <Play className="w-3.5 h-3.5 mr-1" /> {t("sprints.start", "Start")}
                    </Button>
                  )}
                  {sprint.status === "ACTIVE" && (
                    <Button size="sm" variant="secondary" onClick={() => handleCompleteSprint(sprint)}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t("sprints.complete", "Complete")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Body — droppable */}
              {isExpanded && (() => {
                const isClosed = sprint.status === "COMPLETED" || sprint.status === "CANCELLED";
                return (
                  <DroppableZone id={containerId} isDragging={!!activeIssue} className="border-t border-border" disabled={isClosed}>
                    {sprintIssues.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {t("issues.noIssues", "No issues in this sprint")}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {sprintIssues.map(issue => (
                          <DraggableIssueRow
                            key={issue.id}
                            issue={issue}
                            containerId={containerId}
                            issueTypes={issueTypes}
                            issuePriorities={issuePriorities}
                            members={members}
                            onClick={() => setSelectedIssue(issue)}
                            isSelected={selectedIssueIds.has(issue.id)}
                            onToggleSelect={() => toggleSelectIssue(issue.id)}
                            isGroupDragging={!!(activeIssue && selectedIssueIds.has(activeIssue.id) && selectedIssueIds.has(issue.id) && issue.id !== activeIssue.id)}
                          />
                        ))}
                      </div>
                    )}
                    {!isClosed && (
                      <div className="px-4 py-2 border-t border-border">
                        <button
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => { setCreateSprintId(sprint.id); setShowCreateModal(true); }}
                        >
                          <Plus className="w-4 h-4" /> {t("issues.createIssue", "Create issue")}
                        </button>
                      </div>
                    )}
                  </DroppableZone>
                );
              })()}
            </div>
          );
        })}

        {/* Backlog Section — droppable */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{t("issues.backlog", "Backlog")}</span>
            <span className="text-xs text-muted-foreground">
              ({filterIssues(localBacklog).length} {t("issues.issues", "issues")})
            </span>
          </div>
          <DroppableZone id="backlog" isDragging={!!activeIssue} className="border-t border-border">
            {filterIssues(localBacklog).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("issues.emptyBacklog", "Backlog is empty")}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filterIssues(localBacklog).map(issue => (
                  <DraggableIssueRow
                    key={issue.id}
                    issue={issue}
                    containerId="backlog"
                    issueTypes={issueTypes}
                    issuePriorities={issuePriorities}
                    members={members}
                    onClick={() => setSelectedIssue(issue)}
                    sprints={sprints}
                    onMoveToSprint={(sprintId) => handleMoveToSprint(issue.id, sprintId)}
                    isSelected={selectedIssueIds.has(issue.id)}
                    onToggleSelect={() => toggleSelectIssue(issue.id)}
                    isGroupDragging={!!(activeIssue && selectedIssueIds.has(activeIssue.id) && selectedIssueIds.has(issue.id) && issue.id !== activeIssue.id)}
                  />
                ))}
              </div>
            )}
            <div className="px-4 py-2 border-t border-border">
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setCreateSprintId(null); setShowCreateModal(true); }}
              >
                <Plus className="w-4 h-4" /> {t("issues.createIssue", "Create issue")}
              </button>
            </div>
          </DroppableZone>
        </div>

      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeIssue ? (() => {
          const isMulti = selectedIssueIds.has(activeIssue.id) && selectedIssueIds.size > 1;
          const allStackIds = isMulti
            ? [...selectedIssueIds].filter(id => id !== activeIssue.id)
            : [];
          const visibleStackIds = allStackIds.slice(0, 3);
          const hiddenCount = allStackIds.length - visibleStackIds.length;
          return (
            <div className="pointer-events-none min-w-[320px] flex flex-col rounded-md shadow-lg overflow-hidden border border-blue-400">
              <div className="relative bg-card px-3 py-2 flex items-center gap-1">
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-60" />
                <IssueRow issue={activeIssue} issueTypes={issueTypes} issuePriorities={issuePriorities} members={members} onClick={() => { }} />
                {isMulti && (
                  <div className="absolute -top-2 -right-2 z-20 min-w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center px-1.5 shadow">
                    {selectedIssueIds.size}
                  </div>
                )}
              </div>
              {visibleStackIds.map(id => {
                const s = allIssuesMap[id];
                if (!s) return null;
                return (
                  <div key={id} className="bg-muted/50 border-t border-border px-3 py-2 flex items-center gap-1 opacity-80">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-40" />
                    <IssueRow issue={s} issueTypes={issueTypes} issuePriorities={issuePriorities} members={members} onClick={() => { }} />
                  </div>
                );
              })}
              {hiddenCount > 0 && (
                <div className="bg-muted/50 border-t border-border px-3 py-1.5 text-xs text-muted-foreground text-center">
                  +{hiddenCount} more
                </div>
              )}
            </div>
          );
        })() : null}
      </DragOverlay>

      {/* Modals */}
      <CreateIssueModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultSprintId={createSprintId}
      />
      <IssueDetailModal
        open={!!selectedIssue}
        onClose={closeSelectedIssue}
        issue={selectedIssue}
        targetCommentId={searchParams.get("commentId")}
        onOptimisticUpdate={(updatedIssue) => {
          setSelectedIssue(updatedIssue);
          setLocalIssues((prev) => {
            const without = prev.filter((item) => item.id !== updatedIssue.id);
            return updatedIssue.sprintId ? [...without, updatedIssue] : without;
          });
          setLocalBacklog((prev) => {
            const without = prev.filter((item) => item.id !== updatedIssue.id);
            return updatedIssue.sprintId ? without : [...without, updatedIssue];
          });
        }}
        onRollbackUpdate={(previousIssue) => {
          setSelectedIssue(previousIssue);
          setLocalIssues((prev) => {
            const without = prev.filter((item) => item.id !== previousIssue.id);
            return previousIssue.sprintId ? [...without, previousIssue] : without;
          });
          setLocalBacklog((prev) => {
            const without = prev.filter((item) => item.id !== previousIssue.id);
            return previousIssue.sprintId ? without : [...without, previousIssue];
          });
        }}
        onUpdate={closeSelectedIssue}
        onDelete={() => {
          const deletedIssueId = selectedIssue?.id;
          closeSelectedIssue();
          if (deletedIssueId) {
            setLocalIssues((prev) => prev.filter((item) => item.id !== deletedIssueId));
            setLocalBacklog((prev) => prev.filter((item) => item.id !== deletedIssueId));
          }
        }}
      />
    </DndContext>
  );
}

// ── Inline Issue Row ────────────────────────────────────────────
function IssueRow({ issue, issueTypes, issuePriorities, members, onClick, sprints, onMoveToSprint }) {
  const typeName = issueTypes.find(t => t.id === issue.issueTypeId)?.name || "TASK";
  const priorityObj = issuePriorities.find(p => p.id === issue.priorityId);
  const TypeIcon = getIssueTypeIcon(typeName);
  const typeColor = getIssueTypeColor(typeName);
  const { icon: PriorityIcon, color: prioColor } = getPriorityIcon(priorityObj?.name);
  const assigneeObj = members.find(m => (m.accountId || m.id) === issue.assigneeId) || issue?.assignee;
  const assigneeName = assigneeObj?.fullName || assigneeObj?.userName || assigneeObj?.name || assigneeObj?.email;

  return (
    <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={onClick}>
      <TypeIcon className={`w-4 h-4 flex-shrink-0 ${typeColor}`} />
      <span className="text-xs text-muted-foreground font-mono w-16 flex-shrink-0">{issue.issueKey}</span>
      <span className="text-sm text-foreground flex-1 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        {issue.title}
      </span>
      <PriorityIcon className={`w-4 h-4 flex-shrink-0 ${prioColor}`} title={priorityObj?.name} />
      {issue.storyPoints != null && (
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
          {issue.storyPoints}
        </span>
      )}
      <Avatar
        user={assigneeObj}
        name={assigneeName || "Unassigned"}
        size="xs"
        className={!assigneeName ? "bg-muted text-muted-foreground" : ""}
      />
      {/* Move-to-sprint dropdown (backlog items only) */}
      {sprints && onMoveToSprint && (
        <select
          className="text-xs border border-border rounded px-1 py-0.5 bg-background text-foreground flex-shrink-0"
          onClick={e => e.stopPropagation()}
          onChange={e => { if (e.target.value) onMoveToSprint(e.target.value); }}
          defaultValue=""
        >
          <option value="" disabled>→ Sprint</option>
          {sprints
            .filter(s => s.status === "PLANNED" || s.status === "ACTIVE")
            .map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))
          }
        </select>
      )}
    </div>
  );
}
