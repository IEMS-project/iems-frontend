import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useProject } from "@/features/projects/context/ProjectContext";
import { projectService } from "@/features/projects/api/projectService";
import { workflowService } from "@/features/projects/api/workflowService";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Settings2, Layers, Flag, GitBranch,
  ArrowRight, Shield, ChevronRight
} from "lucide-react";

export default function SettingsTab() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const {
    workflows, workflowStatuses, issueTypes, issuePriorities, roles,
    workflowsLoading, refreshWorkflows, refreshIssueTypes, refreshIssuePriorities, refreshRoles
  } = useProject();

  const [activeSection, setActiveSection] = useState("workflow");

  const sections = [
    { id: "workflow", label: t("settings.workflow", "Workflow"), icon: GitBranch },
    { id: "issueTypes", label: t("settings.issueTypes", "Issue Types"), icon: Layers },
    { id: "priorities", label: t("settings.priorities", "Priorities"), icon: Flag },
    { id: "roles", label: t("settings.roles", "Roles"), icon: Shield },
  ];

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Sidebar */}
      <div className="w-48 shrink-0">
        <nav className="space-y-1">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === "workflow" && <WorkflowSection />}
        {activeSection === "issueTypes" && <IssueTypesSection />}
        {activeSection === "priorities" && <PrioritiesSection />}
        {activeSection === "roles" && <RolesSection />}
      </div>
    </div>
  );
}

// ── Workflow Section ──────────────────────────────────────────
function WorkflowSection() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { workflows, workflowStatuses, refreshWorkflows } = useProject();
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({ name: "", category: "IN_PROGRESS", color: "#3b82f6", sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deletingStatusId, setDeletingStatusId] = useState(null);

  const defaultWf = workflows.find(w => w.isDefault) || workflows[0];

  const handleAddStatus = async () => {
    if (!statusForm.name.trim() || !defaultWf) return;
    try {
      setSaving(true);
      await workflowService.createStatus(projectId, defaultWf.id, {
        name: statusForm.name.trim(),
        category: statusForm.category,
        color: statusForm.color,
        sortOrder: workflowStatuses.length + 1,
      });
      toast.success(t("settings.statusAdded", "Status added"));
      await refreshWorkflows();
      setShowAddStatus(false);
      setStatusForm({ name: "", category: "IN_PROGRESS", color: "#3b82f6", sortOrder: 0 });
    } catch (e) {
      toast.error(e?.message || "Error adding status");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteStatus = async () => {
    if (!defaultWf || !deletingStatusId) return;
    const idx = workflowStatuses.findIndex(s => s.id === deletingStatusId);
    const targetStatus = idx > 0 ? workflowStatuses[idx - 1] : workflowStatuses[idx + 1];
    try {
      if (targetStatus) {
        const allIssues = await issueService.getIssues(projectId);
        const toMove = allIssues.filter(i => i.statusId === deletingStatusId);
        if (toMove.length > 0) {
          await Promise.all(toMove.map(issue =>
            issueService.changeStatus(projectId, issue.id, targetStatus.id)
          ));
        }
      }
      await workflowService.deleteStatus(projectId, defaultWf.id, deletingStatusId);
      toast.success(t("settings.statusDeleted", "Status removed"));
      await refreshWorkflows();
    } catch (e) {
      toast.error(e?.message || "Error deleting status");
    }
  };

  const deletingStatus = workflowStatuses.find(s => s.id === deletingStatusId);
  const deletingIdx = workflowStatuses.findIndex(s => s.id === deletingStatusId);
  const deleteTargetStatus = deletingIdx > 0 ? workflowStatuses[deletingIdx - 1] : workflowStatuses[deletingIdx + 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t("settings.workflowStatuses", "Workflow Statuses")}</h3>
        <Button size="sm" onClick={() => setShowAddStatus(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t("settings.addStatus", "Add Status")}
        </Button>
      </div>

      <div className="space-y-2">
        {workflowStatuses.map(status => (
          <div key={status.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: status.color || "#ccc" }} />
            <span className="font-medium text-foreground flex-1">{status.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{status.category}</span>
            <span className="text-xs text-muted-foreground">#{status.sortOrder}</span>
            {workflowStatuses.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => setDeletingStatusId(status.id)}>
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Transitions visualization */}
      <div className="mt-6 p-4 rounded-md bg-muted/50 border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2">{t("settings.flow", "Workflow Flow")}</h4>
        <div className="flex items-center gap-2 flex-wrap">
          {workflowStatuses.map((status, idx) => (
            <React.Fragment key={status.id}>
              <span className="px-3 py-1 rounded-md text-sm font-medium text-white" style={{ backgroundColor: status.color || "#666" }}>
                {status.name}
              </span>
              {idx < workflowStatuses.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Add Status Modal */}
      <Modal open={showAddStatus} onClose={() => setShowAddStatus(false)} title={t("settings.addStatus", "Add Status")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddStatus(false)}>{t("ui.common.cancel")}</Button>
            <Button onClick={handleAddStatus} disabled={saving}>{saving ? "..." : t("ui.common.save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input value={statusForm.name} onChange={e => setStatusForm({ ...statusForm, name: e.target.value })} placeholder="Status name" />
          <select className="w-full rounded-md border border-border bg-background text-foreground p-2 text-sm"
            value={statusForm.category} onChange={e => setStatusForm({ ...statusForm, category: e.target.value })}>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
          <Input type="color" value={statusForm.color} onChange={e => setStatusForm({ ...statusForm, color: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingStatusId}
        onOpenChange={open => !open && setDeletingStatusId(null)}
        onConfirm={confirmDeleteStatus}
        title={t("settings.deleteStatus", "Delete Status")}
        description={
          deleteTargetStatus
            ? `${t("settings.deleteStatusConfirm", `Are you sure you want to delete "${deletingStatus?.name}"?`)} ${t("settings.deleteStatusMigrate", `All issues will be moved to "${deleteTargetStatus.name}".`)}`
            : t("settings.deleteStatusConfirm", `Are you sure you want to delete "${deletingStatus?.name}"?`)
        }
        confirmText={t("common.delete", "Delete")}
        cancelText={t("ui.common.cancel")}
        variant="destructive"
      />
    </div>
  );
}

// ── Issue Types Section ───────────────────────────────────────
const ISSUE_TYPE_ICONS = [
  "🐛", "✨", "📋", "🔥", "🔧", "📝", "🚀", "💡",
  "⚠️", "🎯", "🔍", "💬", "🧪", "🔒", "🎨", "📊",
  "⭐", "❌", "📦", "🏷️", "🔗", "📌", "🛠️", "🌟",
];

function IconPickerPopover({ value, onChange, pickerId, activeIconPicker, setActiveIconPicker }) {
  const isOpen = activeIconPicker === pickerId;
  return (
    <div className="relative shrink-0">
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveIconPicker(null)} />
      )}
      <button
        type="button"
        onClick={() => setActiveIconPicker(isOpen ? null : pickerId)}
        className="w-9 h-9 rounded border border-border bg-muted flex items-center justify-center text-lg hover:bg-accent transition-colors"
        title="Pick an icon"
      >
        {value || <Layers className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="absolute z-50 top-10 left-0 bg-popover border border-border rounded-lg shadow-lg p-2 w-52">
          <div className="grid grid-cols-8 gap-1">
            {ISSUE_TYPE_ICONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onChange(emoji); setActiveIconPicker(null); }}
                className={`w-6 h-6 flex items-center justify-center rounded text-base hover:bg-accent transition-colors ${value === emoji ? "bg-blue-100 dark:bg-blue-900" : ""}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setActiveIconPicker(null); }}
              className="mt-1 w-full text-xs text-muted-foreground hover:text-destructive text-center"
            >
              Remove icon
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function IssueTypesSection() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { issueTypes, refreshIssueTypes } = useProject();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", iconUrl: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", iconUrl: "" });
  const [activeIconPicker, setActiveIconPicker] = useState(null);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      await projectService.createIssueType(projectId, {
        name: form.name.trim(),
        description: form.description,
        iconUrl: form.iconUrl || null,
      });
      toast.success(t("settings.typeAdded", "Issue type added"));
      await refreshIssueTypes();
      setShowAdd(false);
      setForm({ name: "", description: "", iconUrl: "" });
    } catch (e) {
      toast.error(e?.message || "Error");
    } finally { setSaving(false); }
  };

  const startEdit = (type) => {
    setEditingId(type.id);
    setEditForm({ name: type.name, description: type.description || "", iconUrl: type.iconUrl || "" });
    setActiveIconPicker(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return;
    try {
      setSaving(true);
      await projectService.updateIssueType(projectId, editingId, {
        name: editForm.name.trim(),
        description: editForm.description,
        iconUrl: editForm.iconUrl || null,
      });
      toast.success(t("settings.typeUpdated", "Issue type updated"));
      await refreshIssueTypes();
      setEditingId(null);
    } catch (e) {
      toast.error(e?.message || "Error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await projectService.deleteIssueType(projectId, id);
      toast.success(t("settings.typeDeleted", "Issue type deleted"));
      await refreshIssueTypes();
    } catch (e) { toast.error(e?.message || "Error"); }
  };

  const inputCls = "w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t("settings.issueTypes", "Issue Types")}</h3>
        <Button size="sm" onClick={() => { setShowAdd(true); setActiveIconPicker(null); }}>
          <Plus className="w-4 h-4 mr-1" /> {t("ui.common.add")}
        </Button>
      </div>
      <div className="space-y-2">
        {issueTypes.map(type => (
          <div key={type.id} className="rounded-md border border-border bg-card">
            {editingId === type.id ? (
              <div className="flex items-center gap-2 p-3">
                <IconPickerPopover
                  value={editForm.iconUrl}
                  onChange={v => setEditForm(f => ({ ...f, iconUrl: v }))}
                  pickerId={`edit-${type.id}`}
                  activeIconPicker={activeIconPicker}
                  setActiveIconPicker={setActiveIconPicker}
                />
                <Input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls + " flex-1"}
                  placeholder="Issue type name"
                  autoFocus
                />
                <Input
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className={inputCls + " flex-1"}
                  placeholder="Description (optional)"
                />
                <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? "..." : t("ui.common.save", "Save")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                  {t("ui.common.cancel", "Cancel")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3">
                <span className="w-7 h-7 flex items-center justify-center text-lg shrink-0">
                  {type.iconUrl || <Layers className="w-4 h-4 text-muted-foreground" />}
                </span>
                <span className="font-medium text-foreground flex-1">{type.name}</span>
                {type.description && <span className="text-xs text-muted-foreground">{type.description}</span>}
                <Button size="sm" variant="ghost" onClick={() => startEdit(type)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(type.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm({ name: "", description: "", iconUrl: "" }); setActiveIconPicker(null); }}
        title={t("settings.addType", "Add Issue Type")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setShowAdd(false); setActiveIconPicker(null); }}>{t("ui.common.cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "..." : t("ui.common.save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconPickerPopover
              value={form.iconUrl}
              onChange={v => setForm(f => ({ ...f, iconUrl: v }))}
              pickerId="add"
              activeIconPicker={activeIconPicker}
              setActiveIconPicker={setActiveIconPicker}
            />
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. FEATURE" />
          </div>
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Description (optional)" />
        </div>
      </Modal>
    </div>
  );
}

// ── Priorities Section ─────────────────────────────────────────
function PrioritiesSection() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { issuePriorities, refreshIssuePriorities } = useProject();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#FFAB00" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      await projectService.createIssuePriority(projectId, { name: form.name.trim(), color: form.color });
      toast.success(t("settings.priorityAdded", "Priority added"));
      await refreshIssuePriorities();
      setShowAdd(false);
      setForm({ name: "", color: "#FFAB00" });
    } catch (e) { toast.error(e?.message || "Error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await projectService.deleteIssuePriority(projectId, id);
      toast.success(t("settings.priorityDeleted", "Priority deleted"));
      await refreshIssuePriorities();
    } catch (e) { toast.error(e?.message || "Error"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t("settings.priorities", "Priorities")}</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t("ui.common.add")}
        </Button>
      </div>
      <div className="space-y-2">
        {issuePriorities.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: p.color || "#ccc" }} />
            <span className="font-medium text-foreground flex-1">{p.name}</span>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("settings.addPriority", "Add Priority")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>{t("ui.common.cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>{t("ui.common.save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Critical" />
          <Input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

// ── Roles Section ──────────────────────────────────────────────
const PERMISSION_GROUPS = [
  {
    group: "Projects",
    perms: [
      { code: "PROJECT_READ", label: "Read" },
      { code: "PROJECT_CREATE", label: "Create" },
      { code: "PROJECT_UPDATE", label: "Update" },
      { code: "PROJECT_DELETE", label: "Delete" },
    ],
  },
  {
    group: "Issues",
    perms: [
      { code: "ISSUE_READ", label: "Read" },
      { code: "ISSUE_CREATE", label: "Create" },
      { code: "ISSUE_UPDATE", label: "Update" },
      { code: "ISSUE_DELETE", label: "Delete" },
    ],
  },
  {
    group: "Workflows",
    perms: [
      { code: "WORKFLOW_READ", label: "Read" },
      { code: "WORKFLOW_CREATE", label: "Create" },
      { code: "WORKFLOW_UPDATE", label: "Update" },
      { code: "WORKFLOW_DELETE", label: "Delete" },
    ],
  },
  {
    group: "Roles",
    perms: [
      { code: "ROLE_READ", label: "Read" },
      { code: "ROLE_CREATE", label: "Create" },
      { code: "ROLE_UPDATE", label: "Update" },
      { code: "ROLE_DELETE", label: "Delete" },
    ],
  },
  {
    group: "Sprints",
    perms: [
      { code: "SPRINT_READ", label: "Read" },
      { code: "SPRINT_CREATE", label: "Create" },
      { code: "SPRINT_UPDATE", label: "Update" },
      { code: "SPRINT_DELETE", label: "Delete" },
    ],
  },
  {
    group: "Members",
    perms: [
      { code: "MEMBER_INVITE", label: "Invite" },
      { code: "MEMBER_REMOVE", label: "Remove" },
      { code: "MEMBER_ROLE_ASSIGN", label: "Assign role" },
    ],
  },
  {
    group: "Documents",
    perms: [
      { code: "DOCUMENT_VIEW", label: "View" },
      { code: "DOCUMENT_MODIFY", label: "Modify" },
    ],
  },
];

function RolesSection() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { roles, refreshRoles } = useProject();
  const [expandedRoleId, setExpandedRoleId] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({}); // { [roleId]: Set<string> }
  const [draftPerms, setDraftPerms] = useState({}); // { [roleId]: Set<string> }
  const [loadingPerms, setLoadingPerms] = useState(new Set());
  const [savingPerms, setSavingPerms] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const loadPermissions = async (roleId) => {
    if (rolePermissions[roleId]) {
      setDraftPerms(prev => ({ ...prev, [roleId]: new Set(rolePermissions[roleId]) }));
      return;
    }
    setLoadingPerms(prev => new Set([...prev, roleId]));
    try {
      const perms = await projectService.getRolePermissions(projectId, roleId);
      const permSet = new Set(perms);
      setRolePermissions(prev => ({ ...prev, [roleId]: permSet }));
      setDraftPerms(prev => ({ ...prev, [roleId]: new Set(permSet) }));
    } catch (e) {
      toast.error("Failed to load permissions");
    } finally {
      setLoadingPerms(prev => { const s = new Set(prev); s.delete(roleId); return s; });
    }
  };

  const handleExpandRole = async (roleId) => {
    if (expandedRoleId === roleId) {
      setExpandedRoleId(null);
    } else {
      setExpandedRoleId(roleId);
      await loadPermissions(roleId);
    }
  };

  const handleTogglePermission = (roleId, permCode, enable) => {
    setDraftPerms(prev => {
      const s = new Set(prev[roleId] || []);
      const groupInfo = PERMISSION_GROUPS.find(g => g.perms.some(p => p.code === permCode));
      
      if (enable) {
        s.add(permCode);
        if (!permCode.endsWith("_READ") && groupInfo) {
          const readPerm = groupInfo.perms.find(p => p.code.endsWith("_READ"));
          if (readPerm) s.add(readPerm.code);
        }
      } else {
        s.delete(permCode);
        if (permCode.endsWith("_READ") && groupInfo) {
          groupInfo.perms.forEach(p => s.delete(p.code));
        }
      }
      return { ...prev, [roleId]: s };
    });
  };

  const handleToggleGroup = (roleId, groupPerms, enable) => {
    setDraftPerms(prev => {
      const s = new Set(prev[roleId] || []);
      groupPerms.forEach(p => {
        if (enable) s.add(p.code);
        else s.delete(p.code);
      });
      return { ...prev, [roleId]: s };
    });
  };

  const handleToggleAll = (roleId, enable) => {
    setDraftPerms(prev => {
      const s = new Set();
      if (enable) {
        PERMISSION_GROUPS.forEach(g => g.perms.forEach(p => s.add(p.code)));
      }
      return { ...prev, [roleId]: s };
    });
  };

  const handleSavePermissions = async (roleId) => {
    const original = rolePermissions[roleId] || new Set();
    const currentDraft = draftPerms[roleId] || new Set();
    const toAdd = [...currentDraft].filter(p => !original.has(p));
    const toRemove = [...original].filter(p => !currentDraft.has(p));
    
    if (toAdd.length === 0 && toRemove.length === 0) return;

    setSavingPerms(prev => new Set([...prev, roleId]));
    try {
      const promises = [
        ...toAdd.map(code => projectService.assignPermission(projectId, roleId, code)),
        ...toRemove.map(code => projectService.removePermission(projectId, roleId, code))
      ];
      await Promise.all(promises);
      toast.success(t("settings.permissionsSaved", "Permissions saved successfully"));
      
      setRolePermissions(prev => ({ ...prev, [roleId]: new Set(currentDraft) }));
    } catch (e) {
      toast.error(e?.message || "Failed to save permissions");
    } finally {
      setSavingPerms(prev => { const s = new Set(prev); s.delete(roleId); return s; });
    }
  };

  const handleDiscardPermissions = (roleId) => {
    setDraftPerms(prev => ({ ...prev, [roleId]: new Set(rolePermissions[roleId] || []) }));
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      await projectService.addProjectRole(projectId, {
        name: form.name.trim(),
        description: form.description,
        isDefault: false,
      });
      toast.success(t("settings.roleAdded", "Role added"));
      await refreshRoles();
      setShowAdd(false);
      setForm({ name: "", description: "" });
    } catch (e) { toast.error(e?.message || "Error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (roleId) => {
    try {
      await projectService.deleteProjectRole(projectId, roleId);
      toast.success(t("settings.roleDeleted", "Role deleted"));
      if (expandedRoleId === roleId) setExpandedRoleId(null);
      await refreshRoles();
    } catch (e) { toast.error(e?.message || "Error"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t("settings.roles", "Roles & Permissions")}</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t("ui.common.add")}
        </Button>
      </div>

      <div className="space-y-2">
        {roles.map(role => {
          const isExpanded = expandedRoleId === role.id;
          const perms = rolePermissions[role.id] || new Set();
          const isLoadingPerms = loadingPerms.has(role.id);
          return (
            <div key={role.id} className="rounded-md border border-border bg-card overflow-hidden">
              {/* Role header */}
              <div className="flex items-center gap-3 p-3">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground flex-1">{role.name}</span>
                {role.description && <span className="text-xs text-muted-foreground">{role.description}</span>}
                {role.isDefault && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Default</span>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleExpandRole(role.id)} title="Manage permissions">
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                </Button>
                {!role.isDefault && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(role.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                )}
              </div>

              {/* Permissions panel */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-3 bg-muted/30">
                  {role.isDefault && (
                    <p className="text-xs text-muted-foreground py-2">
                      Admin/default role permissions are locked.
                    </p>
                  )}
                  {isLoadingPerms ? (
                    <p className="text-xs text-muted-foreground py-2">Loading permissions…</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                        <div className="flex items-center gap-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Permissions</p>
                          
                          {/* Save & Discard Buttons */}
                          {!role.isDefault && draftPerms[role.id] && (() => {
                            const original = rolePermissions[role.id] || new Set();
                            const currentDraft = draftPerms[role.id];
                            
                            const toAdd = [...currentDraft].filter(p => !original.has(p));
                            const toRemove = [...original].filter(p => !currentDraft.has(p));
                            
                            const isDirty = toAdd.length > 0 || toRemove.length > 0;
                            
                            return isDirty ? (
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => handleSavePermissions(role.id)} disabled={savingPerms.has(role.id)}>
                                  {savingPerms.has(role.id) ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDiscardPermissions(role.id)} disabled={savingPerms.has(role.id)}>
                                  Discard
                                </Button>
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <Checkbox
                            checked={PERMISSION_GROUPS.every(g => g.perms.every(p => (draftPerms[role.id] || new Set()).has(p.code)))}
                            disabled={role.isDefault}
                            onChange={(e) => handleToggleAll(role.id, e.target.checked)}
                          />
                          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Select All</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {PERMISSION_GROUPS.map(({ group, perms: groupPerms }) => {
                          const currentDraft = draftPerms[role.id] || new Set();
                          const isGroupChecked = groupPerms.length > 0 && groupPerms.every(p => currentDraft.has(p.code));
                          const isGroupIndeterminate = !isGroupChecked && groupPerms.some(p => currentDraft.has(p.code));

                          return (
                            <div key={group}>
                              <div className="flex items-center gap-2 mb-2">
                                <Checkbox
                                  checked={isGroupChecked ? true : isGroupIndeterminate ? "indeterminate" : false}
                                  disabled={role.isDefault}
                                  onChange={(e) => handleToggleGroup(role.id, groupPerms, e.target.checked)}
                                />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide m-0 leading-none">{group}</p>
                              </div>
                              <div className="space-y-1.5 ml-5">
                                {groupPerms.map(({ code, label }) => {
                                  const enabled = currentDraft.has(code);
                                  const isLocked = role.isDefault;
                                  return (
                                    <label key={code} className="flex items-center gap-2 cursor-pointer select-none">
                                      <Checkbox
                                        checked={enabled}
                                        disabled={isLocked}
                                        onChange={(e) => handleTogglePermission(role.id, code, e.target.checked)}
                                      />
                                      <span className={`text-sm ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                                        {label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("settings.addRole", "Add Role")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>{t("ui.common.cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "..." : t("ui.common.save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Role name" />
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" />
        </div>
      </Modal>
    </div>
  );
}
