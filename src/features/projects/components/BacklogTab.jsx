import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from "@dnd-kit/core";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "./IssueCard";
import CreateIssueModal from "./CreateIssueModal";
import IssueDetailModal from "./IssueDetailModal";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { sprintService } from "@/features/projects/api/sprintService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus, ChevronDown, ChevronRight, Play, CheckCircle2, Search,
  Layers, GripVertical,
} from "lucide-react";

const SPRINT_STATUS_COLORS = {
  PLANNED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// ── Droppable zone with blue-ring highlight on hover ────────────
function DroppableZone({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-150",
        isOver && "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-inset ring-blue-400",
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
  const {
    issues, backlogIssues, sprints, issueTypes, issuePriorities,
    members, issuesLoading, sprintsLoading, refreshIssues, refreshSprints,
  } = useProject();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSprintId, setCreateSprintId] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [expandedSprints, setExpandedSprints] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIssue, setActiveIssue] = useState(null);

  // Multi-select
  const [selectedIssueIds, setSelectedIssueIds] = useState(new Set());

  // Local copies for optimistic updates — synced from context when not mid-operation
  const [localIssues, setLocalIssues] = useState(issues);
  const [localBacklog, setLocalBacklog] = useState(backlogIssues);
  React.useEffect(() => { setLocalIssues(issues); }, [issues]);
  React.useEffect(() => { setLocalBacklog(backlogIssues); }, [backlogIssues]);

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
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(i =>
      i.title?.toLowerCase().includes(q) ||
      i.issueKey?.toLowerCase().includes(q)
    );
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
    // Auto-expand ACTIVE/PLANNED sprints so all drop zones are visible
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("issues.search", "Search issues...")}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
            />
          </div>
          <Button size="sm" onClick={() => { setCreateSprintId(null); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4 mr-1" /> {t("issues.createIssue", "Create Issue")}
          </Button>
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
              {isExpanded && (
                <DroppableZone id={containerId} className="border-t border-border">
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
                  <div className="px-4 py-2 border-t border-border">
                    <button
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setCreateSprintId(sprint.id); setShowCreateModal(true); }}
                    >
                      <Plus className="w-4 h-4" /> {t("issues.createIssue", "Create issue")}
                    </button>
                  </div>
                </DroppableZone>
              )}
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
          <DroppableZone id="backlog" className="border-t border-border">
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
                <IssueRow issue={activeIssue} issueTypes={issueTypes} issuePriorities={issuePriorities} members={members} onClick={() => {}} />
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
                    <IssueRow issue={s} issueTypes={issueTypes} issuePriorities={issuePriorities} members={members} onClick={() => {}} />
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
        onClose={() => setSelectedIssue(null)}
        issue={selectedIssue}
        onUpdate={() => setSelectedIssue(null)}
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
      {issue.assigneeId && (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
          {(issue.assigneeId || "?")[0]?.toUpperCase()}
        </div>
      )}
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
