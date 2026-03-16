import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar.jsx";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import UserSelect from "./UserSelect";
import { useParams } from "react-router-dom";
import { projectService } from "@/features/projects/api/projectService";
import { useProject } from "@/features/projects/context/ProjectContext";
import { toast } from "sonner";
import { Shield, Search, UserPlus, ChevronRight } from "lucide-react";

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
];

export default function Members() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const { members, roles, assignableUsers, membersLoading, rolesLoading, refreshMembers } = useProject();

    const [searchQuery, setSearchQuery] = useState("");
    const [detailMember, setDetailMember] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ userId: "", roleId: "" });
    const [addLoading, setAddLoading] = useState(false);

    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members;
        const q = searchQuery.toLowerCase();
        return members.filter(m =>
            (m.userName || "").toLowerCase().includes(q) ||
            (m.userEmail || "").toLowerCase().includes(q) ||
            (m.roleName || m.role || "").toLowerCase().includes(q)
        );
    }, [members, searchQuery]);

    const handleAddMember = async () => {
        if (!addForm.userId) {
            toast.warning(t("projects.detail.members.messages.userRequired"));
            return;
        }
        if (!addForm.roleId) {
            toast.warning(t("projects.detail.members.messages.roleRequired"));
            return;
        }
        setAddLoading(true);
        try {
            await projectService.addProjectMember(projectId, {
                accountId: addForm.userId,
                roleId: addForm.roleId,
            });
            await refreshMembers();
            setShowAddModal(false);
            setAddForm({ userId: "", roleId: "" });
            toast.success(t("projects.detail.members.messages.added"));
        } catch (e) {
            toast.error(e?.message || t("projects.detail.members.messages.loadError"));
        } finally {
            setAddLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search members..."
                        className="pl-8 text-sm h-9"
                    />
                </div>
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    {t("ui.common.add")}
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {membersLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                            <Skeleton className="h-3 w-28" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><Skeleton className="h-3 w-40" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                    <td className="px-4 py-3" />
                                </tr>
                            ))
                        ) : filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                                    {members.length === 0 ? "Chưa có thành viên nào" : "Không tìm thấy thành viên"}
                                </td>
                            </tr>
                        ) : (
                            filteredMembers.map(m => (
                                <tr
                                    key={m.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => setDetailMember(m)}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={m} size="sm" />
                                            <span className="font-medium text-foreground">
                                                {m.userName || m.userEmail}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {m.userEmail}
                                    </td>
                                    <td className="px-4 py-3 text-foreground">
                                        {m.roleName || m.role || (
                                            <span className="text-muted-foreground italic text-xs">No role</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={m.status === "ACTIVE" ? "green" : "gray"}>
                                            {m.status === "ACTIVE"
                                                ? t("projects.detail.members.statuses.active")
                                                : t("projects.detail.members.statuses.inactive")}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Member Detail Modal */}
            {detailMember && (
                <MemberDetailModal
                    member={detailMember}
                    roles={roles}
                    projectId={projectId}
                    onRefresh={async () => {
                        await refreshMembers();
                    }}
                    onClose={() => setDetailMember(null)}
                />
            )}

            {/* Add Member Modal */}
            <Modal
                open={showAddModal}
                onClose={() => { setShowAddModal(false); setAddForm({ userId: "", roleId: "" }); }}
                title={t("projects.detail.members.add")}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => { setShowAddModal(false); setAddForm({ userId: "", roleId: "" }); }}>
                            {t("ui.common.cancel")}
                        </Button>
                        <Button onClick={handleAddMember} disabled={addLoading}>
                            {addLoading ? "..." : t("ui.common.add")}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.detail.members.form.user")}
                        </label>
                        <UserSelect
                            assignableUsers={assignableUsers}
                            value={addForm.userId}
                            onChange={id => setAddForm(f => ({ ...f, userId: id }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.detail.members.form.role")}
                        </label>
                        <select
                            value={addForm.roleId}
                            onChange={e => setAddForm(f => ({ ...f, roleId: e.target.value }))}
                            disabled={rolesLoading}
                            className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30 disabled:opacity-50"
                        >
                            <option value="">
                                {rolesLoading ? "Loading roles..." : t("projects.detail.members.form.selectRole")}
                            </option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.roleName || r.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// ── Member Detail Modal ────────────────────────────────────────

function MemberDetailModal({ member, roles, projectId, onRefresh, onClose }) {
    const { t } = useTranslation();

    const [editingRole, setEditingRole] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(member.roleId || "");
    const [savingRole, setSavingRole] = useState(false);

    const [rolePerms, setRolePerms] = useState(null);
    const [directPerms, setDirectPerms] = useState(null);
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [togglingPerm, setTogglingPerm] = useState(new Set());

    const loadPerms = useCallback(async (roleId) => {
        setLoadingPerms(true);
        try {
            const [rPerms, dPerms] = await Promise.all([
                roleId
                    ? projectService.getRolePermissions(projectId, roleId).catch(() => [])
                    : Promise.resolve([]),
                projectService.getMemberPermissions(projectId, member.userId)
                    .catch(() => ({ granted: [], denied: [] })),
            ]);
            setRolePerms(new Set(Array.isArray(rPerms) ? rPerms : []));
            setDirectPerms({
                granted: new Set(dPerms?.granted || []),
                denied: new Set(dPerms?.denied || []),
            });
        } finally {
            setLoadingPerms(false);
        }
    }, [projectId, member.userId]);

    useEffect(() => {
        loadPerms(member.roleId);
    }, [loadPerms, member.roleId]);

    const getPermState = (code) => {
        if (!rolePerms || !directPerms) return "loading";
        if (directPerms.denied.has(code)) return "denied";
        if (directPerms.granted.has(code)) return "granted";
        if (rolePerms.has(code)) return "role";
        return "none";
    };

    const isEffective = (code) => {
        const s = getPermState(code);
        return s === "role" || s === "granted";
    };

    const handleTogglePerm = async (code) => {
        if (togglingPerm.has(code)) return;
        const state = getPermState(code);
        setTogglingPerm(prev => new Set([...prev, code]));
        try {
            if (state === "role") {
                await projectService.denyMemberPermission(projectId, member.userId, code);
                setDirectPerms(prev => ({ ...prev, denied: new Set([...prev.denied, code]) }));
            } else if (state === "denied") {
                await projectService.resetMemberPermission(projectId, member.userId, code);
                setDirectPerms(prev => { const s = new Set(prev.denied); s.delete(code); return { ...prev, denied: s }; });
            } else if (state === "none") {
                await projectService.grantMemberPermission(projectId, member.userId, code);
                setDirectPerms(prev => ({ ...prev, granted: new Set([...prev.granted, code]) }));
            } else if (state === "granted") {
                await projectService.resetMemberPermission(projectId, member.userId, code);
                setDirectPerms(prev => { const s = new Set(prev.granted); s.delete(code); return { ...prev, granted: s }; });
            }
        } catch (e) {
            toast.error(e?.message || "Failed to update permission");
        } finally {
            setTogglingPerm(prev => { const s = new Set(prev); s.delete(code); return s; });
        }
    };

    const handleRoleChange = async () => {
        if (selectedRoleId === (member.roleId || "")) { setEditingRole(false); return; }
        setSavingRole(true);
        try {
            await projectService.updateMemberRole(projectId, member.userId, selectedRoleId);
            await onRefresh();
            const newRole = roles.find(r => r.id === selectedRoleId);
            toast.success(`Role updated${newRole ? ` to ${newRole.roleName}` : ""}`);
            setEditingRole(false);
            const rPerms = await projectService.getRolePermissions(projectId, selectedRoleId).catch(() => []);
            setRolePerms(new Set(Array.isArray(rPerms) ? rPerms : []));
        } catch (e) {
            toast.error(e?.message || "Failed to update role");
        } finally {
            setSavingRole(false);
        }
    };

    const matchedRole = roles.find(r => r.id === member.roleId);
    const isAdminRoleMember = Boolean(matchedRole?.isDefault);
    const currentRoleName = member.roleName || member.role ||
        matchedRole?.roleName || matchedRole?.name || null;

    return (
        <Modal
            open
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <Avatar user={member} size="md" />
                    <div>
                        <div className="text-base font-semibold text-foreground leading-tight">
                            {member.userName || member.userEmail}
                        </div>
                        {member.userName && (
                            <div className="text-xs text-muted-foreground">{member.userEmail}</div>
                        )}
                    </div>
                    <Badge variant={member.status === "ACTIVE" ? "green" : "gray"} className="ml-1">
                        {member.status === "ACTIVE"
                            ? t("projects.detail.members.statuses.active")
                            : t("projects.detail.members.statuses.inactive")}
                    </Badge>
                </div>
            }
            footer={
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Role */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            Role
                        </h4>
                        {!editingRole && (
                            <Button size="sm" variant="ghost" onClick={() => setEditingRole(true)}>
                                Change
                            </Button>
                        )}
                    </div>
                    {editingRole ? (
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedRoleId}
                                onChange={e => setSelectedRoleId(e.target.value)}
                                className="flex-1 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                            >
                                <option value="">No role</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.roleName || r.name}</option>
                                ))}
                            </select>
                            <Button size="sm" onClick={handleRoleChange} disabled={savingRole}>
                                {savingRole ? "..." : "Save"}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => { setEditingRole(false); setSelectedRoleId(member.roleId || ""); }}>
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40">
                            <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-sm text-foreground">
                                {currentRoleName || <span className="text-muted-foreground italic">No role assigned</span>}
                            </span>
                        </div>
                    )}
                </div>

                {/* Permissions */}
                <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        Permissions
                    </h4>

                    {isAdminRoleMember && (
                        <div className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                            Admin/default role members cannot be edited with direct user permission overrides.
                        </div>
                    )}

                    <div className="flex items-center gap-5 text-xs text-muted-foreground mb-4 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded border-2 border-blue-400 bg-blue-100 dark:bg-blue-900/40 inline-block" />
                            Từ role
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900/40 inline-block" />
                            Cấp trực tiếp
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded border-2 border-red-400 bg-red-100 dark:bg-red-900/40 inline-block" />
                            Đã từ chối
                        </span>
                    </div>

                    {loadingPerms ? (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-16 mb-2" />
                                    {Array.from({ length: 3 }).map((__, j) => (
                                        <Skeleton key={j} className="h-4 w-full" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            {PERMISSION_GROUPS.map(({ group, perms }) => (
                                <div key={group}>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        {group}
                                    </p>
                                    <div className="space-y-2">
                                        {perms.map(({ code, label }) => {
                                            const state = getPermState(code);
                                            const isToggling = togglingPerm.has(code);
                                            const isLocked = isAdminRoleMember;

                                            let checkboxCls = "rounded border-gray-300 dark:border-gray-600";
                                            let labelCls = "text-sm text-foreground";
                                            let badge = null;

                                            if (state === "denied") {
                                                checkboxCls = "rounded accent-red-500";
                                                labelCls = "text-sm text-red-600 dark:text-red-400 line-through";
                                                badge = <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 ml-1">denied</span>;
                                            } else if (state === "granted") {
                                                checkboxCls = "rounded accent-green-500";
                                                labelCls = "text-sm text-green-700 dark:text-green-400 font-medium";
                                                badge = <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ml-1">direct</span>;
                                            } else if (state === "role") {
                                                checkboxCls = "rounded accent-blue-500";
                                            }

                                            return (
                                                <label
                                                    key={code}
                                                    className={`flex items-center gap-2 cursor-pointer select-none ${isToggling || isLocked ? "opacity-50 pointer-events-none" : ""}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isEffective(code)}
                                                        disabled={isToggling || isLocked}
                                                        onChange={() => handleTogglePerm(code)}
                                                        className={checkboxCls}
                                                    />
                                                    <span className={labelCls}>
                                                        {label}{badge}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
