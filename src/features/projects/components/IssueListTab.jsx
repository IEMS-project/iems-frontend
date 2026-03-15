import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { useProject } from "@/features/projects/context/ProjectContext";
import { getIssueTypeIcon, getIssueTypeColor, getPriorityIcon } from "./IssueCard";
import IssueDetailModal from "./IssueDetailModal";
import CreateIssueModal from "./CreateIssueModal";
import Skeleton from "@/components/ui/Skeleton";

function Avatar({ name, size = 6 }) {
  const initials = (name || "?")
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

const SORT_FIELDS = ["title", "status", "priority", "sprint", "storyPoints"];

export default function IssueListTab() {
  const { t } = useTranslation();
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

  const statusMap = useMemo(() =>
    Object.fromEntries(workflowStatuses.map(s => [s.id, s])), [workflowStatuses]);
  const typeMap = useMemo(() =>
    Object.fromEntries(issueTypes.map(t => [t.id, t])), [issueTypes]);
  const priorityMap = useMemo(() =>
    Object.fromEntries(issuePriorities.map(p => [p.id, p])), [issuePriorities]);
  const memberMap = useMemo(() => {
    const map = {};
    members.forEach(m => { map[m.accountId || m.id] = m; });
    return map;
  }, [members]);
  const sprintMap = useMemo(() =>
    Object.fromEntries(sprints.map(s => [s.id, s])), [sprints]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasActiveFilters = filterStatus || filterType || filterPriority || filterAssignee || filterSprint || search;

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterType("");
    setFilterPriority("");
    setFilterAssignee("");
    setFilterSprint("");
  };

  const filteredSorted = useMemo(() => {
    let list = [...(issues || [])];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.issueKey?.toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter(i => i.statusId === filterStatus);
    if (filterType) list = list.filter(i => i.issueTypeId === filterType);
    if (filterPriority) list = list.filter(i => i.priorityId === filterPriority);
    if (filterAssignee) list = list.filter(i => (i.assigneeId || i.assignee?.id) === filterAssignee);
    if (filterSprint) list = list.filter(i => i.sprintId === filterSprint);

    list.sort((a, b) => {
      let va, vb;
      if (sortField === "title") { va = a.title || ""; vb = b.title || ""; }
      else if (sortField === "status") { va = statusMap[a.statusId]?.name || ""; vb = statusMap[b.statusId]?.name || ""; }
      else if (sortField === "priority") { va = priorityMap[a.priorityId]?.name || "zzz"; vb = priorityMap[b.priorityId]?.name || "zzz"; }
      else if (sortField === "sprint") { va = sprintMap[a.sprintId]?.name || "zzz"; vb = sprintMap[b.sprintId]?.name || "zzz"; }
      else if (sortField === "storyPoints") { va = a.storyPoints ?? -1; vb = b.storyPoints ?? -1; }
      else { va = ""; vb = ""; }

      if (typeof va === "string") {
        const cmp = va.localeCompare(vb);
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });

    return list;
  }, [issues, search, filterStatus, filterType, filterPriority, filterAssignee, filterSprint,
    sortField, sortDir, statusMap, priorityMap, sprintMap]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />;
  };

  const ThBtn = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-0.5 font-semibold text-xs uppercase tracking-wide hover:text-foreground text-muted-foreground transition-colors"
    >
      {label}<SortIcon field={field} />
    </button>
  );

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
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("issues.search", "Search...")}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm"
        >
          <option value="">{t("issues.filters.status", "Status: All")}</option>
          {workflowStatuses.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm"
        >
          <option value="">{t("issues.filters.type", "Type: All")}</option>
          {issueTypes.map(tp => (
            <option key={tp.id} value={tp.id}>{tp.name}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm"
        >
          <option value="">{t("issues.filters.priority", "Priority: All")}</option>
          {issuePriorities.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm"
        >
          <option value="">{t("issues.filters.assignee", "Assignee: All")}</option>
          {members.map(m => (
            <option key={m.accountId || m.id} value={m.accountId || m.id}>
              {m.fullName || m.email || m.accountId}
            </option>
          ))}
        </select>

        {/* Sprint filter */}
        <select
          value={filterSprint}
          onChange={e => setFilterSprint(e.target.value)}
          className="rounded-md border border-border bg-background text-foreground px-2 py-2 text-sm"
        >
          <option value="">{t("issues.filters.sprint", "Sprint: All")}</option>
          {sprints.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {t("issues.clearFilters", "Clear")}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredSorted.length} {t("issues.issues", "issues")}
          </span>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("issues.createIssue", "Create")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left w-16">
                <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Key
                </span>
              </th>
              <th className="px-3 py-2.5 text-left">
                <ThBtn field="title" label={t("issues.columns.title", "Title")} />
              </th>
              <th className="px-3 py-2.5 text-left w-32">
                <ThBtn field="status" label={t("issues.columns.status", "Status")} />
              </th>
              <th className="px-3 py-2.5 text-left w-28">
                <ThBtn field="priority" label={t("issues.columns.priority", "Priority")} />
              </th>
              <th className="px-3 py-2.5 text-left w-36">
                <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  {t("issues.columns.assignee", "Assignee")}
                </span>
              </th>
              <th className="px-3 py-2.5 text-left w-36">
                <ThBtn field="sprint" label={t("issues.columns.sprint", "Sprint")} />
              </th>
              <th className="px-3 py-2.5 text-center w-16">
                <ThBtn field="storyPoints" label="SP" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? t("issues.noResults", "No issues match the current filters.")
                    : t("issues.empty", "No issues yet. Create your first issue!")}
                </td>
              </tr>
            ) : (
              filteredSorted.map(issue => {
                const status = statusMap[issue.statusId];
                const type = typeMap[issue.issueTypeId];
                const priority = priorityMap[issue.priorityId];
                const assigneeId = issue.assigneeId || issue.assignee?.id;
                const assignee = memberMap[assigneeId];
                const sprint = sprintMap[issue.sprintId];

                const TypeIcon = getIssueTypeIcon(type?.name);
                const typeColor = getIssueTypeColor(type?.name);
                const { icon: PrioIcon, color: prioColor } = getPriorityIcon(priority?.name);

                return (
                  <tr
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    {/* Key + Type Icon */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className={`w-3.5 h-3.5 flex-shrink-0 ${typeColor}`} />
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {issue.issueKey}
                        </span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-3 py-2.5 max-w-xs">
                      <span className="font-medium text-foreground line-clamp-2">
                        {issue.title}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      {status ? (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          {status.color && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                          )}
                          <span className="text-foreground">{status.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-2.5">
                      {priority ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <PrioIcon className={`w-3.5 h-3.5 ${prioColor}`} />
                          <span className="text-foreground">{priority.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-2.5">
                      {assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={assignee.fullName || assignee.email} size={6} />
                          <span className="text-xs text-foreground truncate max-w-[90px]">
                            {assignee.fullName || assignee.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Sprint */}
                    <td className="px-3 py-2.5">
                      {sprint ? (
                        <span className="text-xs text-foreground truncate block max-w-[130px]">
                          {sprint.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Backlog</span>
                      )}
                    </td>

                    {/* Story Points */}
                    <td className="px-3 py-2.5 text-center">
                      {issue.storyPoints != null ? (
                        <span className="text-xs font-medium text-foreground">
                          {issue.storyPoints}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        issue={selectedIssue}
        onUpdate={async () => {
          setSelectedIssue(null);
          await refreshIssues();
        }}
      />

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => {
          setShowCreate(false);
          await refreshIssues();
        }}
      />
    </div>
  );
}
