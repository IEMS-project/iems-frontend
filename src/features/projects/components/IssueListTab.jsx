import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Search, Plus, X, ChevronUp, ChevronDown, ChevronDown as ChevDown,
  Check, Columns, User, ExternalLink,
} from "lucide-react";
import { useProject } from "@/features/projects/context/ProjectContext";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "./IssueCard";
import IssueDetailModal from "./IssueDetailModal";
import CreateIssueModal from "./CreateIssueModal";
import Skeleton from "@/components/ui/Skeleton";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateDates, todayStr } from "@/features/projects/utils/dateValidation";
import { getStatusStyle } from "../utils/issueStyles";
import IssueRow from "./issue-table/IssueRow";

// ── Column definitions ─────────────────────────────────────────────────────

const ALL_COLUMNS = [
  { key: "key",        label: "Key",          sortable: false, defaultVisible: true,  width: "w-28" },
  { key: "title",      label: "Title",        sortable: true,  defaultVisible: true,  width: "min-w-[200px]" },
  { key: "status",     label: "Status",       sortable: true,  defaultVisible: true,  width: "w-36" },
  { key: "priority",   label: "Priority",     sortable: true,  defaultVisible: true,  width: "w-32" },
  { key: "assignee",   label: "Assignee",     sortable: false, defaultVisible: true,  width: "w-40" },
  { key: "sprint",     label: "Sprint",       sortable: true,  defaultVisible: true,  width: "w-36" },
  { key: "storyPoints",label: "SP",           sortable: true,  defaultVisible: true,  width: "w-16" },
  { key: "dueDate",    label: "Due Date",     sortable: true,  defaultVisible: true,  width: "w-32" },
  { key: "type",       label: "Type",         sortable: false, defaultVisible: false, width: "w-28" },
  { key: "reporter",   label: "Reporter",     sortable: false, defaultVisible: false, width: "w-36" },
  { key: "parent",     label: "Parent",       sortable: false, defaultVisible: false, width: "w-28" },
];



// ── Column toggle dropdown ─────────────────────────────────────────────────

function ColumnToggleDropdown({ visibleColumns, onToggle, onClose, anchorEl }) {
  const ref = useRef(null);
  useEffect(() => {
    function onMD(e) {
      if (ref.current && !ref.current.contains(e.target) && anchorEl && !anchorEl.contains(e.target)) onClose();
    }
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onMD);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onMD); document.removeEventListener("keydown", onKey); };
  }, [onClose, anchorEl]);

  const rect = anchorEl?.getBoundingClientRect();
  if (!rect) return null;

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 9999, minWidth: 180 }}
      className="rounded-md border border-border bg-popover shadow-xl py-1"
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border mb-1">
        Columns
      </div>
      {ALL_COLUMNS.map(col => (
        <button
          key={col.key}
          type="button"
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-foreground transition-colors"
          onMouseDown={e => { e.preventDefault(); onToggle(col.key); }}
        >
          <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
            visibleColumns.has(col.key) ? "bg-blue-500 border-blue-500" : "border-border bg-background"
          )}>
            {visibleColumns.has(col.key) && <Check className="w-2.5 h-2.5 text-white" />}
          </span>
          {col.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

// ── Main component ──────────────────────────────────────────────────────────

const SORT_FIELDS = ["title", "status", "priority", "sprint", "storyPoints", "dueDate"];

export default function IssueListTab() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const {
    issues, workflowStatuses, issueTypes, issuePriorities, members, sprints,
    issuesLoading, refreshIssues,
  } = useProject();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterSprint, setFilterSprint] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Column visibility
  const defaultVisible = new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
  const [visibleColumns, setVisibleColumns] = useState(defaultVisible);
  const [showColDropdown, setShowColDropdown] = useState(false);
  const colBtnRef = useRef(null);

  const toggleColumn = useCallback((key) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // Lookup maps
  const statusMap = useMemo(() => Object.fromEntries(workflowStatuses.map(s => [s.id, s])), [workflowStatuses]);
  const typeMap = useMemo(() => Object.fromEntries(issueTypes.map(t => [t.id, t])), [issueTypes]);
  const priorityMap = useMemo(() => Object.fromEntries(issuePriorities.map(p => [p.id, p])), [issuePriorities]);
  const memberMap = useMemo(() => {
    const map = {};
    members.forEach(m => {
      const id = m.accountId || m.id || m.userId;
      if (id) map[id] = m;
    });
    return map;
  }, [members]);
  const sprintMap = useMemo(() => Object.fromEntries(sprints.map(s => [s.id, s])), [sprints]);
  const issuesMap = useMemo(() => Object.fromEntries((issues || []).map(i => [i.id, i])), [issues]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const hasActiveFilters = filterStatus || filterType || filterPriority || filterAssignee || filterSprint || search;

  const clearFilters = () => {
    setSearch(""); setFilterStatus(""); setFilterType("");
    setFilterPriority(""); setFilterAssignee(""); setFilterSprint("");
  };

  const filteredSorted = useMemo(() => {
    let list = [...(issues || [])];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(i => i.title?.toLowerCase().includes(q) || i.issueKey?.toLowerCase().includes(q));
    if (filterStatus) list = list.filter(i => i.statusId === filterStatus);
    if (filterType) list = list.filter(i => i.issueTypeId === filterType);
    if (filterPriority) list = list.filter(i => i.priorityId === filterPriority);
    if (filterAssignee) list = list.filter(i => (i.assigneeId || i.assignee?.id) === filterAssignee);
    if (filterSprint) {
      if (filterSprint === "__backlog__") list = list.filter(i => !i.sprintId);
      else list = list.filter(i => i.sprintId === filterSprint);
    }

    list.sort((a, b) => {
      let va, vb;
      if (sortField === "title") { va = a.title || ""; vb = b.title || ""; }
      else if (sortField === "status") { va = statusMap[a.statusId]?.name || ""; vb = statusMap[b.statusId]?.name || ""; }
      else if (sortField === "priority") { va = priorityMap[a.priorityId]?.name || "zzz"; vb = priorityMap[b.priorityId]?.name || "zzz"; }
      else if (sortField === "sprint") { va = sprintMap[a.sprintId]?.name || "zzz"; vb = sprintMap[b.sprintId]?.name || "zzz"; }
      else if (sortField === "storyPoints") { va = a.storyPoints ?? -1; vb = b.storyPoints ?? -1; }
      else if (sortField === "dueDate") { va = a.dueDate || "zzz"; vb = b.dueDate || "zzz"; }
      else { va = ""; vb = ""; }
      if (typeof va === "string") { const cmp = va.localeCompare(vb); return sortDir === "asc" ? cmp : -cmp; }
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [issues, search, filterStatus, filterType, filterPriority, filterAssignee, filterSprint,
    sortField, sortDir, statusMap, priorityMap, sprintMap]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  const ThBtn = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-0.5 font-semibold text-xs uppercase tracking-wide hover:text-foreground text-muted-foreground transition-colors whitespace-nowrap"
    >
      {label}<SortIcon field={field} />
    </button>
  );

  const ThLabel = ({ label }) => (
    <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">{label}</span>
  );

  const colCount = visibleColumns.size;

  if (issuesLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("issues.search", "Search issues...")}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
          />
        </div>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm">
          <option value="">{t("issues.filters.status", "Status: All")}</option>
          {workflowStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* Type filter */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm">
          <option value="">{t("issues.filters.type", "Type: All")}</option>
          {issueTypes.map(tp => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
        </select>

        {/* Priority filter */}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm">
          <option value="">{t("issues.filters.priority", "Priority: All")}</option>
          {issuePriorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Assignee filter */}
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm">
          <option value="">{t("issues.filters.assignee", "Assignee: All")}</option>
          {members.map(m => {
            const id = m.accountId || m.id || m.userId;
            return <option key={id} value={id}>{m.fullName || m.userName || m.email || id}</option>;
          })}
        </select>

        {/* Sprint filter */}
        <select value={filterSprint} onChange={e => setFilterSprint(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm">
          <option value="">{t("issues.filters.sprint", "Sprint: All")}</option>
          <option value="__backlog__">Backlog</option>
          {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" />{t("issues.clearFilters", "Clear")}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filteredSorted.length} {t("issues.issues", "issues")}</span>

          {/* Column toggle button */}
          <div className="relative">
            <button
              ref={colBtnRef}
              onClick={() => setShowColDropdown(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Columns className="w-4 h-4" />
              Columns
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {showColDropdown && (
              <ColumnToggleDropdown
                visibleColumns={visibleColumns}
                onToggle={toggleColumn}
                onClose={() => setShowColDropdown(false)}
                anchorEl={colBtnRef.current}
              />
            )}
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("issues.createIssue", "Create Issue")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {visibleColumns.has("key")         && <th className="px-3 py-2.5 text-left w-28"><ThLabel label="Key" /></th>}
              {visibleColumns.has("title")        && <th className="px-3 py-2.5 text-left min-w-[200px]"><ThBtn field="title" label={t("issues.columns.title", "Title")} /></th>}
              {visibleColumns.has("status")       && <th className="px-3 py-2.5 text-left w-36"><ThBtn field="status" label={t("issues.columns.status", "Status")} /></th>}
              {visibleColumns.has("priority")     && <th className="px-3 py-2.5 text-left w-32"><ThBtn field="priority" label={t("issues.columns.priority", "Priority")} /></th>}
              {visibleColumns.has("assignee")     && <th className="px-3 py-2.5 text-left w-40"><ThLabel label={t("issues.columns.assignee", "Assignee")} /></th>}
              {visibleColumns.has("sprint")       && <th className="px-3 py-2.5 text-left w-36"><ThBtn field="sprint" label={t("issues.columns.sprint", "Sprint")} /></th>}
              {visibleColumns.has("storyPoints")  && <th className="px-3 py-2.5 text-center w-16"><ThBtn field="storyPoints" label="SP" /></th>}
              {visibleColumns.has("dueDate")      && <th className="px-3 py-2.5 text-left w-32"><ThBtn field="dueDate" label="Due Date" /></th>}
              {visibleColumns.has("type")         && <th className="px-3 py-2.5 text-left w-28"><ThLabel label="Type" /></th>}
              {visibleColumns.has("reporter")     && <th className="px-3 py-2.5 text-left w-36"><ThLabel label="Reporter" /></th>}
              {visibleColumns.has("parent")       && <th className="px-3 py-2.5 text-left w-28"><ThLabel label="Parent" /></th>}
            </tr>
          </thead>
          <tbody>
            {filteredSorted.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? t("issues.noResults", "No issues match the current filters.")
                    : t("issues.empty", "No issues yet. Create your first issue!")}
                </td>
              </tr>
            ) : (
              filteredSorted.map(issue => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  visibleColumns={visibleColumns}
                  issueTypes={issueTypes}
                  issuePriorities={issuePriorities}
                  workflowStatuses={workflowStatuses}
                  members={members}
                  sprints={sprints}
                  statusMap={statusMap}
                  typeMap={typeMap}
                  priorityMap={priorityMap}
                  memberMap={memberMap}
                  sprintMap={sprintMap}
                  issuesMap={issuesMap}
                  projectId={projectId}
                  onOpenDetail={setSelectedIssue}
                  onUpdated={refreshIssues}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        issue={selectedIssue}
        onUpdate={async () => { setSelectedIssue(null); await refreshIssues(); }}
      />

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => { setShowCreate(false); await refreshIssues(); }}
      />
    </div>
  );
}
