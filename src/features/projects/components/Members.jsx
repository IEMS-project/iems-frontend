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
import { userService } from "@/features/profile/api/userService";
import { toast } from "sonner";
import { Shield, Search, UserPlus, ChevronRight, UserCheck, UserX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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

export default function Members() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const { members, roles, membersLoading, rolesLoading, refreshMembers } = useProject();

    const [searchQuery, setSearchQuery] = useState("");
    const [detailMember, setDetailMember] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ userIds: [], roleId: "" });
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

    const memberAccountIds = useMemo(
        () => new Set(members.map((m) => String(m.userId)).filter(Boolean)),
        [members]
    );

    const searchAssignableUsers = useCallback(async (query, page, size) => {
        const result = await userService.searchUserBasicInfos({
            query,
            page,
            size,
            excludeAccountIds: [],
        });

        return {
            ...result,
            items: (result.items || []).map((u) => ({
                ...u,
                userId: u.id || u.userId,
                id: u.id || u.userId,
                alreadyMember: memberAccountIds.has(String(u.id || u.userId)),
            })),
        };
    }, [memberAccountIds]);

    const handleAddMember = async () => {
        if (!addForm.userIds.length) {
            toast.warning(t("projects.detail.members.messages.userRequired"));
            return;
        }
        if (!addForm.roleId) {
            toast.warning(t("projects.detail.members.messages.roleRequired"));
            return;
        }
        setAddLoading(true);
        try {
            await projectService.addProjectMembersBatch(
                projectId,
                addForm.userIds.map(accountId => ({ accountId, roleId: addForm.roleId }))
            );
            await refreshMembers();
            setShowAddModal(false);
            setAddForm({ userIds: [], roleId: "" });
            toast.success(
                addForm.userIds.length === 1
                    ? t("projects.detail.members.messages.added")
                    : `${addForm.userIds.length} members added successfully`
            );
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
                onClose={() => { setShowAddModal(false); setAddForm({ userIds: [], roleId: "" }); }}
                title={t("projects.detail.members.add")}
                className="max-w-2xl !max-h-[95vh]"
                contentClassName="!overflow-visible !overflow-y-visible"
                footer={
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                            {addForm.userIds.length > 0
                                ? `${addForm.userIds.length} user${addForm.userIds.length > 1 ? 's' : ''} selected`
                                : 'No users selected'}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => { setShowAddModal(false); setAddForm({ userIds: [], roleId: "" }); }}>
                                {t("ui.common.cancel")}
                            </Button>
                            <Button onClick={handleAddMember} disabled={addLoading || !addForm.userIds.length || !addForm.roleId}>
                                {addLoading
                                    ? t("ui.common.loading", { defaultValue: "Loading..." })
                                    : addForm.userIds.length > 1
                                        ? `Add ${addForm.userIds.length} Members`
                                        : t("ui.common.add")}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                        Search by name or email. You can select multiple users at once.
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                {t("projects.detail.members.form.user")}
                            </label>
                            <UserSelect
                                multiple
                                value={addForm.userIds}
                                onChange={(ids) => setAddForm((f) => ({ ...f, userIds: ids }))}
                                searchUsers={searchAssignableUsers}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
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
    const [savingStatus, setSavingStatus] = useState(false);

    const [rolePerms, setRolePerms] = useState(null); // Set of role perms
    const [directPerms, setDirectPerms] = useState(null); // { granted: Set, denied: Set }
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [draftDirectPerms, setDraftDirectPerms] = useState({ granted: new Set(), denied: new Set() });
    const [savingPerms, setSavingPerms] = useState(false);
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
            const dPermsMapped = {
                granted: new Set(dPerms?.granted || []),
                denied: new Set(dPerms?.denied || []),
            };
            setDirectPerms(dPermsMapped);
            setDraftDirectPerms({
                granted: new Set(dPermsMapped.granted),
                denied: new Set(dPermsMapped.denied),
            });
        } catch (e) {
            console.error("Error loading perms", e);
        } finally {
            setLoadingPerms(false);
        }
    }, [projectId, member.userId]);

    useEffect(() => {
        loadPerms(member.roleId);
    }, [loadPerms, member.roleId]);

    const getPermState = (code, currentDraft = draftDirectPerms) => {
        if (!rolePerms) return "none";
        if (currentDraft.denied.has(code)) return "denied";
        if (currentDraft.granted.has(code)) return "granted";
        if (rolePerms.has(code)) return "role";
        return "none";
    };

    const isEffective = (code, currentDraft = draftDirectPerms) => {
        if (member.status !== "ACTIVE") return false;
        const s = getPermState(code, currentDraft);
        return s === "role" || s === "granted";
    };

    const applyToggleFunc = (code, enable, currentDraft) => {
        const roleHas = rolePerms?.has(code);
        let nextGranted = new Set(currentDraft.granted);
        let nextDenied = new Set(currentDraft.denied);

        if (enable) {
            if (roleHas) nextDenied.delete(code);
            else nextGranted.add(code);
        } else {
            if (roleHas) nextDenied.add(code);
            else nextGranted.delete(code);
        }
        return { granted: nextGranted, denied: nextDenied };
    };

    const handleTogglePermGroup = (groupPerms, enable) => {
        setDraftDirectPerms(prev => {
            let nextState = prev;
            groupPerms.forEach(p => {
                nextState = applyToggleFunc(p.code, enable, nextState);
            });
            return nextState;
        });
    };

    const handleTogglePermAll = (enable) => {
        setDraftDirectPerms(prev => {
            let nextState = prev;
            PERMISSION_GROUPS.forEach(g => g.perms.forEach(p => {
                nextState = applyToggleFunc(p.code, enable, nextState);
            }));
            return nextState;
        });
    };

    const handleTogglePerm = (code, enable) => {
        setDraftDirectPerms(prev => {
            let nextState = applyToggleFunc(code, enable, prev);
            const groupInfo = PERMISSION_GROUPS.find(g => g.perms.some(p => p.code === code));
            if (groupInfo) {
                if (enable && !code.endsWith("_READ")) {
                    const readPerm = groupInfo.perms.find(p => p.code.endsWith("_READ"));
                    if (readPerm) nextState = applyToggleFunc(readPerm.code, true, nextState);
                } else if (!enable && code.endsWith("_READ")) {
                    groupInfo.perms.forEach(p => {
                        nextState = applyToggleFunc(p.code, false, nextState);
                    });
                }
            }
            return nextState;
        });
    };

    const handleSavePerms = async () => {
        setSavingPerms(true);
        try {
            const promises = [];
            const allCodes = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.code));

            allCodes.forEach(code => {
                const origGranted = directPerms.granted.has(code);
                const origDenied = directPerms.denied.has(code);
                const draftGranted = draftDirectPerms.granted.has(code);
                const draftDenied = draftDirectPerms.denied.has(code);

                if (origGranted === draftGranted && origDenied === draftDenied) return;

                promises.push((async () => {
                    if (origGranted || origDenied) {
                        await projectService.resetMemberPermission(projectId, member.userId, code);
                    }
                    if (draftGranted) {
                        await projectService.grantMemberPermission(projectId, member.userId, code);
                    } else if (draftDenied) {
                        await projectService.denyMemberPermission(projectId, member.userId, code);
                    }
                })());
            });

            await Promise.all(promises);
            toast.success("Permissions saved successfully");
            loadPerms(member.roleId);
        } catch (e) {
            toast.error(e?.message || "Failed to save permissions");
        } finally {
            setSavingPerms(false);
        }
    };

    const handleDiscardPerms = () => {
        setDraftDirectPerms({
            granted: new Set(directPerms?.granted || []),
            denied: new Set(directPerms?.denied || []),
        });
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

    const handleStatusChange = async () => {
        const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        setSavingStatus(true);
        try {
            await projectService.updateMemberStatus(projectId, member.userId, nextStatus);
            await onRefresh();
            toast.success(nextStatus === "ACTIVE" ? "Member activated" : "Member deactivated");
            onClose();
        } catch (e) {
            toast.error(e?.message || "Failed to update member status");
        } finally {
            setSavingStatus(false);
        }
    };

    const matchedRole = roles.find(r => r.id === member.roleId);
    const isAdminRoleMember = Boolean(matchedRole?.isDefault);
    const isInactiveMember = member.status !== "ACTIVE";
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
                <div className="flex justify-between gap-2">
                    <Button
                        variant={isInactiveMember ? "secondary" : "ghost"}
                        onClick={handleStatusChange}
                        disabled={savingStatus}
                    >
                        {isInactiveMember ? (
                            <UserCheck className="w-4 h-4 mr-1.5" />
                        ) : (
                            <UserX className="w-4 h-4 mr-1.5 text-red-500" />
                        )}
                        {savingStatus
                            ? "Saving..."
                            : isInactiveMember
                                ? "Activate"
                                : "Deactivate"}
                    </Button>
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

                    {isInactiveMember && (
                        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                            This member is inactive, so they have no effective project permissions until reactivated.
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-5 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-4">
                            {(() => {
                                const isDirty = directPerms && (
                                    [...draftDirectPerms.granted].some(x => !directPerms.granted.has(x)) ||
                                    [...directPerms.granted].some(x => !draftDirectPerms.granted.has(x)) ||
                                    [...draftDirectPerms.denied].some(x => !directPerms.denied.has(x)) ||
                                    [...directPerms.denied].some(x => !draftDirectPerms.denied.has(x))
                                );

                                return isDirty ? (
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={handleSavePerms} disabled={savingPerms}>
                                            {savingPerms ? "Saving..." : "Save Changes"}
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={handleDiscardPerms} disabled={savingPerms}>
                                            Discard
                                        </Button>
                                    </div>
                                ) : null;
                            })()}
                            <label className={`flex items-center gap-2 cursor-pointer select-none ${(isAdminRoleMember || isInactiveMember) ? "opacity-50 pointer-events-none" : ""}`}>
                                <Checkbox
                                    checked={PERMISSION_GROUPS.every(g => g.perms.every(p => isEffective(p.code, draftDirectPerms)))}
                                    disabled={isAdminRoleMember || isInactiveMember || savingPerms || loadingPerms}
                                    onChange={(e) => handleTogglePermAll(e.target.checked)}
                                />
                                <span className="font-semibold text-foreground uppercase tracking-wide">Chọn tất cả</span>
                            </label>
                        </div>
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
                            {PERMISSION_GROUPS.map(({ group, perms }) => {
                                const isGroupChecked = perms.length > 0 && perms.every(p => isEffective(p.code, draftDirectPerms));
                                const isGroupIndeterminate = !isGroupChecked && perms.some(p => isEffective(p.code, draftDirectPerms));

                                return (
                                    <div key={group}>
                                        <div className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                                            <Checkbox
                                                checked={isGroupChecked ? true : isGroupIndeterminate ? "indeterminate" : false}
                                                disabled={isAdminRoleMember || isInactiveMember || savingPerms}
                                                onChange={(e) => handleTogglePermGroup(perms, e.target.checked)}
                                            />
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider m-0 leading-none">
                                                {group}
                                            </p>
                                        </div>
                                        <div className="space-y-2 ml-5">
                                            {perms.map(({ code, label }) => {
                                                const state = getPermState(code, draftDirectPerms);
                                                const isLocked = isAdminRoleMember || isInactiveMember || savingPerms;

                                                let badge = null;

                                                if (state === "denied") {
                                                    badge = <Badge variant="red" className="ml-2 scale-90 origin-left">Denied</Badge>;
                                                } else if (state === "granted") {
                                                    badge = <Badge variant="green" className="ml-2 scale-90 origin-left">Direct</Badge>;
                                                } else if (state === "role") {
                                                    badge = <Badge variant="blue" className="ml-2 scale-90 origin-left">Role</Badge>;
                                                }

                                                return (
                                                    <label
                                                        key={code}
                                                        className={`flex items-center gap-2 cursor-pointer select-none py-1 ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
                                                    >
                                                        <Checkbox
                                                            checked={isEffective(code, draftDirectPerms)}
                                                            disabled={isLocked}
                                                            onChange={(e) => handleTogglePerm(code, e.target.checked)}
                                                        />
                                                        <span className="text-sm text-foreground">
                                                            {label}
                                                        </span>
                                                        {badge}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
