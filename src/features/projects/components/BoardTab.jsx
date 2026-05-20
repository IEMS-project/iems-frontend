import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { GripVertical, Plus, Search, Check, X, Trash2, SlidersHorizontal, ChevronDown } from "lucide-react";
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors, closestCenter,
  useDraggable, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable,
  horizontalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import IssueCard from "./IssueCard";
import IssueDetailModal from "./IssueDetailModal";
import CreateIssueModal from "./CreateIssueModal";
import IssueFiltersDropdown from "./shared/IssueFiltersDropdown";
import { useProject } from "@/features/projects/context/ProjectContext";
import { issueService } from "@/features/projects/api/issueService";
import { sprintService } from "@/features/projects/api/sprintService";
import { workflowService } from "@/features/projects/api/workflowService";
import { toast } from "sonner";

const COL_PRESET_COLORS = [
  "#6b7280", "#3b82f6", "#10b981", "#f59e0b",
  "#f97316", "#ef4444", "#8b5cf6", "#06b6d4",
];

const resolveIssueAssigneeId = (issue) =>
  issue?.assigneeId ||
  issue?.assignee?.accountId ||
  issue?.assignee?.userId ||
  issue?.assignee?.user?.accountId ||
  issue?.assignee?.user?.id ||
  issue?.assignee?.id;

// ── Sortable column shell — grip handle activates dnd-kit ────────
function SortableColumn({ id, children }) {
  const {
    setNodeRef, transform, transition, isDragging,
    attributes, listeners,
  } = useSortable({ id, data: { type: "column" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 250ms cubic-bezier(0.25, 1, 0.5, 1)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-[280px] rounded-lg bg-muted/40 dark:bg-muted/20 flex flex-col ${isDragging ? "opacity-50 shadow-2xl z-10" : "opacity-100"
        }`}
    >
      {children({ gripListeners: listeners, gripAttributes: attributes })}
    </div>
  );
}

// ── Droppable card zone — highlights when a card hovers over ─────
function DroppableCards({ id, children }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[80px] rounded-b-lg transition-all duration-150 ${isOver ? "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-inset ring-blue-400" : ""
        }`}
    >
      {children}
    </div>
  );
}

// ── Draggable card ───────────────────────────────────────────────
function DraggableCard({ issue, children }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: issue.id,
    data: { type: "card", issue },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing touch-none transition-opacity ${isDragging ? "opacity-40" : "opacity-100"
        }`}
    >
      {children}
    </div>
  );
}

export default function BoardTab() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    sprints, workflowStatuses, workflows, issueTypes, issuePriorities, members,
    issuesLoading, workflowsLoading, refreshIssues, refreshWorkflows,
  } = useProject();

  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [sprintIssues, setSprintIssues] = useState([]);
  const [loadingSprintIssues, setLoadingSprintIssues] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterBtnRef = useRef(null);

  // Tracks the active drag (card or column) for DragOverlay + modifier selection
  const [activeItem, setActiveItem] = useState(null);
  const isCardDrag = activeItem?.type === "card";

  // Column order state
  const [columnOrder, setColumnOrder] = useState([]);

  // Add column inline form
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState(COL_PRESET_COLORS[0]);
  const [savingColumn, setSavingColumn] = useState(false);
  const newColInputRef = useRef(null);
  const columnOrderBeforeDrag = useRef(null);

  // Create issue modal
  const [createStatusId, setCreateStatusId] = useState(null);

  // Delete column confirm
  const [deletingColumnId, setDeletingColumnId] = useState(null);

  // Multi-select
  const [selectedIssueIds, setSelectedIssueIds] = useState(new Set());

  useEffect(() => {
    const issueId = searchParams.get("issueId");
    if (!issueId || !projectId) return;

    const localIssue = sprintIssues.find((issue) => String(issue.id) === String(issueId));
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
  }, [searchParams, projectId, sprintIssues]);

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

  // Focus input when add-column form opens
  useEffect(() => {
    if (addingColumn) newColInputRef.current?.focus();
  }, [addingColumn]);

  // Sync columnOrder from context
  useEffect(() => {
    setColumnOrder(workflowStatuses.map(s => s.id));
  }, [workflowStatuses]);

  const orderedStatuses = useMemo(() => {
    return columnOrder
      .map(id => workflowStatuses.find(s => s.id === id))
      .filter(Boolean);
  }, [columnOrder, workflowStatuses]);

  // Auto-select active sprint
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      const active = sprints.find(s => s.status === "ACTIVE");
      setSelectedSprintId(active?.id || sprints[0]?.id || "");
    }
  }, [sprints, selectedSprintId]);

  // Load sprint issues
  const loadSprintIssues = useCallback(async () => {
    if (!selectedSprintId || !projectId) return;
    try {
      setLoadingSprintIssues(true);
      const data = await sprintService.getSprintIssues(projectId, selectedSprintId);
      setSprintIssues(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading sprint issues:", e);
      setSprintIssues([]);
    } finally {
      setLoadingSprintIssues(false);
    }
  }, [projectId, selectedSprintId]);

  useEffect(() => { loadSprintIssues(); }, [loadSprintIssues]);

  const columnData = useMemo(() => {
    let filtered = sprintIssues;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.issueKey?.toLowerCase().includes(q)
      );
    }
    if (filterStatus) filtered = filtered.filter((i) => String(i.statusId || "") === String(filterStatus));
    if (filterType) filtered = filtered.filter((i) => String(i.issueTypeId || "") === String(filterType));
    if (filterPriority) filtered = filtered.filter((i) => String(i.priorityId || "") === String(filterPriority));
    if (filterAssignee) filtered = filtered.filter((i) => String(resolveIssueAssigneeId(i) || "") === String(filterAssignee));
    const columns = {};
    workflowStatuses.forEach(status => { columns[status.id] = { status, issues: [] }; });
    filtered.forEach(issue => {
      if (columns[issue.statusId]) columns[issue.statusId].issues.push(issue);
    });
    return columns;
  }, [sprintIssues, workflowStatuses, searchQuery, filterStatus, filterType, filterPriority, filterAssignee]);

  const activeFilterCount = [filterStatus, filterType, filterPriority, filterAssignee].filter(Boolean).length;
  const hasActiveFilters = Boolean(searchQuery?.trim()) || activeFilterCount > 0;
  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    setFilterType("");
    setFilterPriority("");
    setFilterAssignee("");
  };

  // ── Unified drag handlers ─────────────────────────────────────

  const handleDragStart = ({ active }) => {
    setActiveItem(active.data.current ?? null);
    if (active.data.current?.type === "column") {
      columnOrderBeforeDrag.current = [...columnOrder];
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over || active.data.current?.type !== "column") return;
    const overColId = String(over.id).startsWith("drop-")
      ? String(over.id).slice(5)
      : String(over.id);
    setColumnOrder(prev => {
      const oldIdx = prev.indexOf(String(active.id));
      const newIdx = prev.indexOf(overColId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveItem(null);
    if (!over) return;

    const type = active.data.current?.type;

    // ── Card dropped into a column ──────────────────────────────
    if (type === "card") {
      const overId = String(over.id);
      const targetStatusId = overId.startsWith("drop-")
        ? overId.slice(5)
        : (workflowStatuses.some(s => s.id === overId) ? overId : null);
      if (!targetStatusId) return;
      const issue = active.data.current.issue;
      if (issue.statusId === targetStatusId) return;

      // If the dragged card is part of the selection, move ALL selected; otherwise just this one
      const idsToMove = selectedIssueIds.has(issue.id)
        ? [...selectedIssueIds]
        : [issue.id];

      setSprintIssues(prev =>
        prev.map(i => idsToMove.includes(i.id) ? { ...i, statusId: targetStatusId } : i)
      );
      if (selectedIssueIds.has(issue.id)) setSelectedIssueIds(new Set());

      try {
        await Promise.all(idsToMove.map(id => issueService.changeStatus(projectId, id, targetStatusId)));
      } catch (e) {
        await loadSprintIssues();
        const msg = e?.message || e?.data?.message || "";
        toast.error(
          msg.includes("INVALID_WORKFLOW_TRANSITION")
            ? t("issues.messages.invalidTransition", "Invalid status transition")
            : msg || "Error changing status"
        );
      }
      return;
    }

    // ── Column reorder ──────────────────────────────────────────
    const before = columnOrderBeforeDrag.current;
    columnOrderBeforeDrag.current = null;
    if (!before || before.join(",") === columnOrder.join(",")) return;

    const defaultWf = workflows.find(w => w.isDefault) || workflows[0];
    if (!defaultWf) return;

    try {
      await Promise.all(
        columnOrder.map((statusId, index) =>
          workflowService.updateStatus(projectId, defaultWf.id, statusId, { sortOrder: index + 1 })
        )
      );
      await refreshWorkflows();
    } catch {
      toast.error(t("board.columnReorderError", "Error saving column order"));
      setColumnOrder(before);
    }
  };

  // ── Delete Column ─────────────────────────────────────────────
  const handleDeleteColumn = async (statusId) => {
    const defaultWf = workflows.find(w => w.isDefault) || workflows[0];
    if (!defaultWf) return;

    const currentIndex = columnOrder.indexOf(statusId);
    // Move to lower (previous) column; if first, move to next
    const targetIndex = currentIndex > 0
      ? currentIndex - 1
      : currentIndex + 1;
    const targetStatusId = columnOrder[targetIndex];
    const issuesToMove = sprintIssues.filter(i => i.statusId === statusId);

    // Optimistic update
    setSprintIssues(prev =>
      prev.map(i => i.statusId === statusId ? { ...i, statusId: targetStatusId } : i)
    );
    setColumnOrder(prev => prev.filter(id => id !== statusId));
    setDeletingColumnId(null);

    try {
      if (issuesToMove.length > 0) {
        await Promise.all(
          issuesToMove.map(issue =>
            issueService.changeStatus(projectId, issue.id, targetStatusId)
          )
        );
      }
      await workflowService.deleteStatus(projectId, defaultWf.id, statusId);
      await refreshWorkflows();
    } catch (e) {
      toast.error(e?.message || "Error deleting column");
      await Promise.all([loadSprintIssues(), refreshWorkflows()]);
    }
  };

  // ── Multi-select ──────────────────────────────────────────────
  const toggleSelectIssue = (issueId) => {
    setSelectedIssueIds(prev => {
      const next = new Set(prev);
      next.has(issueId) ? next.delete(issueId) : next.add(issueId);
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") setSelectedIssueIds(new Set()); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Add Column ────────────────────────────────────────────────
  const cancelAddColumn = () => {
    setAddingColumn(false);
    setNewColName("");
    setNewColColor(COL_PRESET_COLORS[0]);
  };

  const handleCreateColumn = async () => {
    const name = newColName.trim();
    if (!name) { newColInputRef.current?.focus(); return; }

    const defaultWf = workflows.find(w => w.isDefault) || workflows[0];
    if (!defaultWf) { toast.error("No workflow found"); return; }

    setSavingColumn(true);
    try {
      await workflowService.createStatus(projectId, defaultWf.id, {
        name,
        color: newColColor,
        sortOrder: columnOrder.length + 1,
      });
      await refreshWorkflows();
      setAddingColumn(false);
      setNewColName("");
      setNewColColor(COL_PRESET_COLORS[0]);
    } catch (e) {
      toast.error(e?.message || "Error creating column");
    } finally {
      setSavingColumn(false);
    }
  };

  // ── Create Issue ──────────────────────────────────────────────
  const handleCreateDone = async () => {
    setCreateStatusId(null);
    await loadSprintIssues();
    await refreshIssues();
  };

  // ── Render ────────────────────────────────────────────────────
  if ((issuesLoading || workflowsLoading) && workflowStatuses.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-96 flex-1" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("issues.search", "Search issues...")}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
          />
        </div>
        <div className="relative">
          <button
            ref={filterBtnRef}
            type="button"
            onClick={() => setShowFilterDropdown((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            <span className={cn(
              "inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-medium",
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
        {hasActiveFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" />{t("issues.clearFilters", "Clear")}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={selectedSprintId}
            onChange={e => setSelectedSprintId(e.target.value)}
            className="rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm font-medium min-w-[180px]"
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.status === "ACTIVE" ? "★" : ""}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            {sprintIssues.length} {t("issues.issues", "issues")}
          </span>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={isCardDrag ? [] : [restrictToHorizontalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* SortableContext only drives column sorting — card IDs are NOT in items */}
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 overflow-x-auto pb-4 items-start" style={{ minHeight: "calc(100vh - 300px)" }}>

            {orderedStatuses.map(status => {
              const colIssues = columnData[status.id]?.issues || [];

              return (
                <SortableColumn key={status.id} id={status.id}>
                  {({ gripListeners, gripAttributes }) => (
                    <>
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            {...gripAttributes}
                            {...gripListeners}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0 touch-none"
                            title={t("board.dragToReorder", "Drag to reorder")}
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          {status.color && (
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: status.color }}
                            />
                          )}
                          <span className="text-sm font-semibold text-foreground truncate">
                            {status.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {colIssues.length}
                          </span>
                          <button
                            onClick={() => setCreateStatusId(status.id)}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={t("issues.createInColumn", "Create issue in this column")}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {columnOrder.length > 1 && (
                            <button
                              onClick={() => setDeletingColumnId(status.id)}
                              className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title={t("board.deleteColumn", "Delete column")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Droppable card zone */}
                      <DroppableCards id={`drop-${status.id}`}>
                        {loadingSprintIssues ? (
                          <div className="space-y-2">
                            <Skeleton className="h-20 w-full rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-lg" />
                          </div>
                        ) : colIssues.length === 0 ? (
                          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                            {t("issues.dropHere", "Drop issues here")}
                          </div>
                        ) : (
                          colIssues.map(issue => (
                            <DraggableCard key={issue.id} issue={issue}>
                              <div
                                className={cn(
                                  selectedIssueIds.has(issue.id) ? "ring-2 ring-blue-400 rounded-lg" : "",
                                  activeItem?.type === "card" &&
                                    selectedIssueIds.has(activeItem.issue?.id) &&
                                    selectedIssueIds.has(issue.id) ? "opacity-30 transition-opacity" : ""
                                )}
                                onClickCapture={e => {
                                  if (e.ctrlKey || e.metaKey) {
                                    e.stopPropagation();
                                    toggleSelectIssue(issue.id);
                                  }
                                }}
                              >
                                <IssueCard
                                  issue={issue}
                                  issueTypes={issueTypes}
                                  issuePriorities={issuePriorities}
                                  members={members}
                                  onClick={setSelectedIssue}
                                />
                              </div>
                            </DraggableCard>
                          ))
                        )}
                      </DroppableCards>
                    </>
                  )}
                </SortableColumn>
              );
            })}

            {/* Add Column */}
            <div className="flex-shrink-0 w-[280px]">
              {addingColumn ? (
                <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                  <input
                    ref={newColInputRef}
                    type="text"
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleCreateColumn();
                      if (e.key === "Escape") cancelAddColumn();
                    }}
                    placeholder={t("board.columnName", "Column name...")}
                    maxLength={50}
                    className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COL_PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewColColor(color)}
                        className="w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none"
                        style={{
                          backgroundColor: color,
                          outline: newColColor === color ? `2px solid ${color}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreateColumn}
                      disabled={savingColumn || !newColName.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      {savingColumn ? t("common.saving", "Saving...") : t("common.add", "Add")}
                    </button>
                    <button
                      onClick={cancelAddColumn}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/30 transition-colors"
                  title={t("board.addColumn", "Add column")}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeItem?.type === "card" ? (() => {
            const dragging = activeItem.issue;
            const isMulti = selectedIssueIds.has(dragging.id) && selectedIssueIds.size > 1;
            const allStackIds = isMulti
              ? [...selectedIssueIds].filter(id => id !== dragging.id)
              : [];
            const visibleStackIds = allStackIds.slice(0, 2);
            const hiddenCount = allStackIds.length - visibleStackIds.length;
            return (
              <div className="pointer-events-none w-[264px] flex flex-col gap-1.5">
                <div className="relative ring-2 ring-blue-400 rounded-lg shadow-xl">
                  <IssueCard issue={dragging} issueTypes={issueTypes} issuePriorities={issuePriorities} members={members} onClick={() => { }} />
                  {isMulti && (
                    <div className="absolute -top-2 -right-2 z-20 min-w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center px-1.5 shadow">
                      {selectedIssueIds.size}
                    </div>
                  )}
                </div>
                {visibleStackIds.map(id => {
                  const s = sprintIssues.find(iss => iss.id === id);
                  if (!s) return null;
                  return (
                    <div key={id} className="opacity-70">
                      <IssueCard issue={s} issueTypes={issueTypes} issuePriorities={issuePriorities} members={members} onClick={() => { }} />
                    </div>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground text-center">
                    +{hiddenCount} more
                  </div>
                )}
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={!!deletingColumnId}
        onOpenChange={open => !open && setDeletingColumnId(null)}
        onConfirm={() => handleDeleteColumn(deletingColumnId)}
        title={t("board.deleteColumn", "Delete Column")}
        description={(() => {
          const col = workflowStatuses.find(s => s.id === deletingColumnId);
          const idx = columnOrder.indexOf(deletingColumnId ?? "");
          const targetId = idx > 0 ? columnOrder[idx - 1] : columnOrder[idx + 1];
          const target = workflowStatuses.find(s => s.id === targetId);
          const count = sprintIssues.filter(i => i.statusId === deletingColumnId).length;
          return count > 0
            ? `${t("board.deleteColumnConfirm", `Are you sure you want to delete column "${col?.name}"?`)} ${count} ${t("board.issuesMoved", `issue(s) will be moved to "${target?.name}".`)}`
            : t("board.deleteColumnConfirmEmpty", `Are you sure you want to delete column "${col?.name}"? This column has no issues.`);
        })()}
        confirmText={t("common.delete", "Delete")}
        cancelText={t("common.cancel", "Cancel")}
        variant="destructive"
      />
      <IssueDetailModal
        open={!!selectedIssue}
        onClose={closeSelectedIssue}
        issue={selectedIssue}
        targetCommentId={searchParams.get("commentId")}
        onUpdate={() => { closeSelectedIssue(); loadSprintIssues(); }}
      />
      <CreateIssueModal
        open={!!createStatusId}
        onClose={() => setCreateStatusId(null)}
        onCreated={handleCreateDone}
        defaultSprintId={selectedSprintId}
        defaultStatusId={createStatusId}
      />
    </div>
  );
}
