import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useProject } from "@/features/projects/context/ProjectContext";
import { projectService } from "@/features/projects/api/projectService";
import { workflowService } from "@/features/projects/api/workflowService";
import { issueService } from "@/features/projects/api/issueService";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Settings2, Layers, Flag, GitBranch,
  ArrowRight, Shield
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
function IssueTypesSection() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { issueTypes, refreshIssueTypes } = useProject();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      await projectService.createIssueType(projectId, { name: form.name.trim(), description: form.description });
      toast.success(t("settings.typeAdded", "Issue type added"));
      await refreshIssueTypes();
      setShowAdd(false);
      setForm({ name: "", description: "" });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t("settings.issueTypes", "Issue Types")}</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t("ui.common.add")}
        </Button>
      </div>
      <div className="space-y-2">
        {issueTypes.map(type => (
          <div key={type.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground flex-1">{type.name}</span>
            {type.description && <span className="text-xs text-muted-foreground">{type.description}</span>}
            <Button size="sm" variant="ghost" onClick={() => handleDelete(type.id)}>
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("settings.addType", "Add Issue Type")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>{t("ui.common.cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>{t("ui.common.save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. FEATURE" />
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
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
function RolesSection() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { roles, refreshRoles } = useProject();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

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
      await refreshRoles();
    } catch (e) { toast.error(e?.message || "Error"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t("settings.roles", "Roles")}</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t("ui.common.add")}
        </Button>
      </div>
      <div className="space-y-2">
        {roles.map(role => (
          <div key={role.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground flex-1">{role.name}</span>
            {role.description && <span className="text-xs text-muted-foreground">{role.description}</span>}
            {role.isDefault && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Default</span>}
            {!role.isDefault && (
              <Button size="sm" variant="ghost" onClick={() => handleDelete(role.id)}>
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("settings.addRole", "Add Role")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>{t("ui.common.cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>{t("ui.common.save")}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Role name" />
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
        </div>
      </Modal>
    </div>
  );
}
