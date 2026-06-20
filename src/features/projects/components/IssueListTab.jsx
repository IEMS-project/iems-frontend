import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Search, Plus, X, ChevronUp, ChevronDown,
  Check, Columns, Download, Upload, SlidersHorizontal,
} from "lucide-react";
import { useProject } from "@/features/projects/context/ProjectContext";
import IssueDetailModal from "./IssueDetailModal";
import CreateIssueModal from "./CreateIssueModal";
import Skeleton from "@/components/ui/skeleton";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import IssueRow from "./issue-table/IssueRow";
import IssueFiltersDropdown from "./shared/IssueFiltersDropdown";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";

// ── Column definitions ─────────────────────────────────────────────────────

const ALL_COLUMNS = [
  { key: "key", label: "Key", sortable: false, defaultVisible: true, width: "w-28" },
  { key: "title", label: "Title", sortable: true, defaultVisible: true, width: "min-w-[200px]" },
  { key: "status", label: "Status", sortable: true, defaultVisible: true, width: "w-36" },
  { key: "priority", label: "Priority", sortable: true, defaultVisible: true, width: "w-32" },
  { key: "assignee", label: "Assignee", sortable: false, defaultVisible: true, width: "w-40" },
  { key: "sprint", label: "Sprint", sortable: true, defaultVisible: true, width: "w-36" },
  { key: "storyPoints", label: "SP", sortable: true, defaultVisible: true, width: "w-16" },
  { key: "dueDate", label: "Due Date", sortable: true, defaultVisible: true, width: "w-32" },
  { key: "type", label: "Type", sortable: false, defaultVisible: false, width: "w-28" },
  { key: "reporter", label: "Reporter", sortable: false, defaultVisible: false, width: "w-36" },
  { key: "parent", label: "Parent", sortable: false, defaultVisible: false, width: "w-28" },
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
const PAGE_SIZE = 8;

const resolveMemberId = (member) =>
  member?.accountId ||
  member?.userId ||
  member?.user?.accountId ||
  member?.user?.id ||
  member?.id;

const resolveIssueAssigneeId = (issue) =>
  issue?.assigneeId ||
  issue?.assignee?.accountId ||
  issue?.assignee?.userId ||
  issue?.assignee?.user?.accountId ||
  issue?.assignee?.user?.id ||
  issue?.assignee?.id;

function ImportIssuesModal({
  open,
  importing,
  selectedFile,
  downloadingTemplate,
  onClose,
  onFileChange,
  onSubmit,
  onDownloadTemplate,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Issues from Excel"
      className="max-w-lg"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-3 py-2 rounded-md border border-border text-sm hover:bg-muted transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      )}
    >
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Upload an .xlsx file with columns: Issue Key, Issue Type, Title, Description, Priority, Assignee Email, Sprint Name, Story Points, Due Date.
        </p>
        <button
          type="button"
          onClick={onDownloadTemplate}
          disabled={importing || downloadingTemplate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {downloadingTemplate ? "Downloading template..." : "Download Template"}
        </button>
        <input
          type="file"
          accept=".xlsx"
          onChange={onFileChange}
          disabled={importing}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        {selectedFile && (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Selected file: <span className="font-medium text-foreground">{selectedFile.name}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function IssueListTab() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const currentUserId = userProfile?.id || userProfile?.userId;

  const {
    workflowStatuses, issueTypes, issuePriorities, members, sprints,
    updateIssueInCache,
  } = useProject();

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });

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
  const [showImport, setShowImport] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Column visibility
  const defaultVisible = new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
  const [visibleColumns, setVisibleColumns] = useState(defaultVisible);
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterBtnRef = useRef(null);
  const colBtnRef = useRef(null);

  const loadPagedIssues = useCallback(async () => {
    if (!projectId) return;
    try {
      setIssuesLoading(true);
      const result = await issueService.getIssuesPaged(projectId, page, PAGE_SIZE);
      setIssues(Array.isArray(result?.content) ? result.content : []);
      setPageInfo({
        page: result?.page ?? page,
        size: result?.size ?? PAGE_SIZE,
        totalElements: result?.totalElements ?? 0,
        totalPages: result?.totalPages ?? 0,
        last: result?.last ?? true,
      });
    } catch (error) {
      setIssues([]);
      setPageInfo({ page, size: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true });
      toast.error(error?.message || "Failed to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }, [projectId, page]);

  useEffect(() => {
    setPage(0);
  }, [projectId]);

  useEffect(() => {
    const issueId = searchParams.get("issueId");
    if (!issueId || !projectId) return;

    const localIssue = issues.find((issue) => String(issue.id) === String(issueId));
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
  }, [searchParams, projectId, issues]);

  const closeSelectedIssue = () => {
    setSelectedIssue(null);
    if (searchParams.has("issueId")) {
      const next = new URLSearchParams(searchParams);
      next.delete("issueId");
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    loadPagedIssues();
  }, [loadPagedIssues]);

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
      const id = resolveMemberId(m);
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

  const activeFilterCount = useMemo(
    () => [filterStatus, filterType, filterPriority, filterAssignee, filterSprint].filter(Boolean).length,
    [filterStatus, filterType, filterPriority, filterAssignee, filterSprint]
  );
  const hasActiveFilters = Boolean(search?.trim()) || activeFilterCount > 0;

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
    if (filterAssignee) {
      const selectedMember = members.find((m) => String(resolveMemberId(m) || "") === String(filterAssignee));
      const selectedEmail = String(selectedMember?.email || selectedMember?.user?.email || "").trim().toLowerCase();
      list = list.filter((i) => {
        const issueAssigneeId = resolveIssueAssigneeId(i);
        const sameId = String(issueAssigneeId || "").trim().toLowerCase() === String(filterAssignee).trim().toLowerCase();
        if (sameId) return true;

        if (!selectedEmail) return false;
        const issueAssigneeEmail = String(i.assignee?.email || i.assigneeEmail || "").trim().toLowerCase();
        return issueAssigneeEmail && issueAssigneeEmail === selectedEmail;
      });
    }
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
  }, [issues, members, search, filterStatus, filterType, filterPriority, filterAssignee, filterSprint,
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

  const handleImportFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedImportFile(file);
  };

  const handleDownloadTemplate = async () => {
    if (!projectId || downloadingTemplate) return;
    try {
      setDownloadingTemplate(true);
      const { blob, fileName } = await issueService.downloadIssueImportTemplate(projectId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName || "issue-import-template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (error) {
      toast.error(error?.message || "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImportIssues = async () => {
    if (!projectId) return;
    if (!selectedImportFile) {
      toast.warning("Please choose an Excel file to import");
      return;
    }

    const fileName = selectedImportFile.name?.toLowerCase() || "";
    if (!fileName.endsWith(".xlsx")) {
      toast.error("Only .xlsx files are supported");
      return;
    }

    try {
      setImporting(true);
      const result = await issueService.importIssuesFromExcel(projectId, selectedImportFile);
      toast.success(result?.message || "Issues imported successfully");
      setShowImport(false);
      setSelectedImportFile(null);
      await loadPagedIssues();
    } catch (error) {
      toast.error(error?.message || "Failed to import issues");
    } finally {
      setImporting(false);
    }
  };

  const handleExportIssues = async () => {
    if (!projectId || exporting) return;
    try {
      setExporting(true);
      const { blob, fileName } = await issueService.downloadIssuesExport(projectId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName || "issues-export.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Issues exported successfully");
    } catch (error) {
      toast.error(error?.message || "Failed to export issues");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/60">
        {/* Search */}
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
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

        {/* Filters popover */}
        <div className="relative">
          <button
            ref={filterBtnRef}
            type="button"
            onClick={() => setShowFilterDropdown(v => !v)}
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
              onClose={() => setShowFilterDropdown(false)}
              onClear={clearFilters}
              anchorEl={filterBtnRef.current}
              workflowStatuses={workflowStatuses}
              issueTypes={issueTypes}
              issuePriorities={issuePriorities}
              members={members}
              sprints={sprints}
              includeBacklogSprintOption
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterType={filterType}
              setFilterType={setFilterType}
              filterPriority={filterPriority}
              setFilterPriority={setFilterPriority}
              filterAssignee={filterAssignee}
              setFilterAssignee={setFilterAssignee}
              filterSprint={filterSprint}
              setFilterSprint={setFilterSprint}
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
            {filterSprint && (
              <span className="px-2 py-0.5 rounded bg-muted border border-border text-[10px]">
                Sprint: {filterSprint === "__backlog__" ? "Backlog" : sprints.find(s => s.id === filterSprint)?.name}
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
          <span className="text-sm text-muted-foreground">
            {pageInfo.totalElements} {t("issues.issues", "issues")}
          </span>

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
            type="button"
            onClick={handleExportIssues}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export"}
          </button>

          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>

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
        <table className="min-w-full w-max text-sm table-auto border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {visibleColumns.has("key") && <th className="px-3 py-2.5 text-left min-w-[100px]"><ThLabel label="Key" /></th>}
              {visibleColumns.has("title") && <th className="px-3 py-2.5 text-left min-w-[280px]"><ThBtn field="title" label={t("issues.columns.title", "Title")} /></th>}
              {visibleColumns.has("status") && <th className="px-3 py-2.5 text-left min-w-[140px] whitespace-nowrap"><ThBtn field="status" label={t("issues.columns.status", "Status")} /></th>}
              {visibleColumns.has("priority") && <th className="px-3 py-2.5 text-left min-w-[120px]"><ThBtn field="priority" label={t("issues.columns.priority", "Priority")} /></th>}
              {visibleColumns.has("assignee") && <th className="px-3 py-2.5 text-left min-w-[150px]"><ThLabel label={t("issues.columns.assignee", "Assignee")} /></th>}
              {visibleColumns.has("sprint") && <th className="px-3 py-2.5 text-left min-w-[140px]"><ThBtn field="sprint" label={t("issues.columns.sprint", "Sprint")} /></th>}
              {visibleColumns.has("storyPoints") && <th className="px-3 py-2.5 text-center min-w-[70px]"><ThBtn field="storyPoints" label="SP" /></th>}
              {visibleColumns.has("dueDate") && <th className="px-3 py-2.5 text-left min-w-[120px]"><ThBtn field="dueDate" label="Due Date" /></th>}
              {visibleColumns.has("type") && <th className="px-3 py-2.5 text-left min-w-[120px]"><ThLabel label="Type" /></th>}
              {visibleColumns.has("reporter") && <th className="px-3 py-2.5 text-left min-w-[140px]"><ThLabel label="Reporter" /></th>}
              {visibleColumns.has("parent") && <th className="px-3 py-2.5 text-left min-w-[110px]"><ThLabel label="Parent" /></th>}
            </tr>
          </thead>
          <tbody>
            {issuesLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <tr key={`issue-loading-${index}`} className="border-b border-border last:border-0">
                  <td colSpan={colCount} className="px-3 py-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                  </td>
                </tr>
              ))
            ) : filteredSorted.length === 0 ? (
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
                  onUpdated={(updatedIssue) => {
                    setIssues((prev) => prev.map((item) => (item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item)));
                    updateIssueInCache?.(updatedIssue);
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={issuesLoading || page <= 0}
          className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-60"
        >
          Prev
        </button>
        <span className="text-sm text-muted-foreground">
          Page {Math.max((pageInfo.page ?? 0) + 1, 1)} / {Math.max(pageInfo.totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={issuesLoading || pageInfo.last || pageInfo.totalPages <= 1}
          className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-60"
        >
          Next
        </button>
      </div>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        open={!!selectedIssue}
        onClose={closeSelectedIssue}
        issue={selectedIssue}
        targetCommentId={searchParams.get("commentId")}
        onUpdate={async () => { closeSelectedIssue(); await loadPagedIssues(); }}
        onDelete={async () => {
          const deletedIssueId = selectedIssue?.id;
          closeSelectedIssue();
          if (deletedIssueId) {
            setIssues((prev) => prev.filter((issue) => issue.id !== deletedIssueId));
            setPageInfo((prev) => ({
              ...prev,
              totalElements: Math.max((prev.totalElements ?? 0) - 1, 0),
            }));
          }
          await loadPagedIssues();
        }}
      />

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => { setShowCreate(false); await loadPagedIssues(); }}
      />

      <ImportIssuesModal
        open={showImport}
        importing={importing}
        selectedFile={selectedImportFile}
        downloadingTemplate={downloadingTemplate}
        onClose={() => {
          if (importing) return;
          setShowImport(false);
          setSelectedImportFile(null);
        }}
        onFileChange={handleImportFileChange}
        onSubmit={handleImportIssues}
        onDownloadTemplate={handleDownloadTemplate}
      />
    </div>
  );
}
