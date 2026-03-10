import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar.jsx";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/select";
import UserSelect from "./UserSelect";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "@/features/projects/api/projectService";
import { userService } from "@/features/profile/api/userService";
import Skeleton from "@/components/ui/Skeleton";
import { PencilLine } from "lucide-react";
import IconActionButton from "@/components/ui/IconActionButton";
import { toast } from "sonner";

const membersData = [];

export default function Members() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        userId: "",
        roleId: "",
        status: "ACTIVE"
    });
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [projectRoles, setProjectRoles] = useState([]);
    const [rolesVersion, setRolesVersion] = useState(0); // Track roles changes
    const listSkeletons = useMemo(() => Array.from({ length: 4 }), []);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await projectService.getProjectMembers(projectId);

                // Check if response indicates permission error
                if (data && data.status === "error" &&
                    (data.message?.includes("Permission denied") ||
                        data.message?.includes("PERMISSION_DENIED"))) {
                    console.log("Permission error in Members response data, redirecting...");
                    navigate("/permission-denied");
                    return;
                }

                setMembers(Array.isArray(data) ? data : []);
                // Load assignable users and project roles in parallel
                const [users, roles] = await Promise.all([
                    (async () => {
                        try { return await userService.getAssignableUsers(); } catch { return []; }
                    })(),
                    (async () => {
                        try { return await projectService.getProjectRoles(projectId); } catch { return []; }
                    })()
                ]);
                setAssignableUsers(Array.isArray(users) ? users : []);
                setProjectRoles(Array.isArray(roles) ? roles : []);
            } catch (e) {
                console.log("Members Error:", e);
                console.log("Error status:", e.status);
                console.log("Error message:", e.message);
                console.log("Error data:", e.data);

                // Check if it's a permission error
                if (e.status === 403 ||
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    console.log("Permission error detected in Members, redirecting...");
                    // Redirect immediately to permission denied page
                    navigate("/permission-denied");
                    return;
                } else {
                    console.error(e);
                }
            } finally {
                setLoading(false);
            }
        };
        if (projectId) load();
    }, [projectId, navigate]);

    // Listen for project roles updates
    useEffect(() => {
        const handleRolesUpdate = async (event) => {
            if (event.detail.projectId === projectId) {
                try {
                    const roles = await projectService.getProjectRoles(projectId);
                    setProjectRoles(Array.isArray(roles) ? roles : []);
                } catch (e) {
                    console.error("Failed to refresh project roles:", e);
                }
            }
        };

        window.addEventListener('projectRolesUpdated', handleRolesUpdate);
        return () => window.removeEventListener('projectRolesUpdated', handleRolesUpdate);
    }, [projectId]);

    const handleEditMember = async (member) => {
        setEditingMember(member);
        setFormData({
            userId: member.userId || "",
            roleId: member.roleId || "",
            status: member.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"
        });
        // Refresh project roles before opening modal
        try {
            const roles = await projectService.getProjectRoles(projectId);
            setProjectRoles(Array.isArray(roles) ? roles : []);
        } catch (e) {
            console.error("Failed to load project roles:", e);
        }
        setShowModal(true);
    };

    const handleAddMember = async () => {
        setEditingMember(null);
        setFormData({
            userId: "",
            roleId: "",
            status: "ACTIVE"
        });
        // Refresh project roles before opening modal
        try {
            const roles = await projectService.getProjectRoles(projectId);
            setProjectRoles(Array.isArray(roles) ? roles : []);
        } catch (e) {
            console.error("Failed to load project roles:", e);
        }
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            if (!formData.userId) {
                toast.warning(t('projects.detail.members.messages.userRequired'));
                return;
            }

            if (!formData.roleId) {
                toast.warning(t('projects.detail.members.messages.roleRequired'));
                return;
            }

            const memberPayload = {
                userId: formData.userId,
                roleId: formData.roleId,
            };

            // Add or update member (backend handles both)
            await projectService.addProjectMember(projectId, memberPayload);

            // Update status if changed (only for edit mode)
            if (editingMember && formData.status !== editingMember.status) {
                const statusValue = formData.status;
                await projectService.updateMemberStatus(projectId, formData.userId, statusValue);
            }

            // Refresh members list
            const updated = await projectService.getProjectMembers(projectId);
            setMembers(Array.isArray(updated) ? updated : []);

            setShowModal(false);
            setFormData({ userId: "", roleId: "", status: "ACTIVE" });
            toast.success(editingMember ? t('projects.detail.members.messages.updated') : t('projects.detail.members.messages.added'));
        } catch (e) {
            console.error("Error with project member:", e);
            const errorMessage = e?.message || t('projects.detail.members.messages.loadError');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingMember(null);
        setFormData({ userId: "", roleId: "", status: "ACTIVE" });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{t('projects.detail.members.title')}</CardTitle>
                        <Button size="sm" onClick={handleAddMember}>+ {t('ui.common.add')}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-44 overflow-y-auto">
                        <ul className="space-y-3">
                            {loading ? (
                                listSkeletons.map((_, idx) => (
                                    <li key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 w-full">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-3 w-1/2" />
                                                <Skeleton className="h-3 w-1/3" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-6 w-12" />
                                    </li>
                                ))
                            ) : members.length === 0 ? (
                                <li className="text-center text-muted-foreground py-4">Chưa có thành viên</li>
                            ) : (
                                members.map(m => (
                                    <li key={m.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={m} size={9} />
                                            <div>
                                                <div className="text-sm font-medium text-foreground">{m.userName || m.userEmail}</div>
                                                <div className="text-xs text-muted-foreground">{m.roleName || m.role || "N/A"}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={m.status === "ACTIVE" ? "green" : "gray"}>
                                                {m.status === "ACTIVE" ? t('projects.detail.members.statuses.active') : t('projects.detail.members.statuses.inactive')}
                                            </Badge>
                                            <IconActionButton
                                                icon={PencilLine}
                                                label={t('projects.detail.members.edit')}
                                                variant="edit"
                                                className="hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground dark:text-gray-300"
                                                onClick={(e) => { e.stopPropagation(); handleEditMember(m); }}
                                            />
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingMember ? t('projects.detail.members.edit') : t('projects.detail.members.add')}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>{t('ui.common.cancel')}</Button>
                        <Button onClick={handleSubmit}>
                            {editingMember ? t('ui.common.edit') : t('ui.common.add')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('projects.detail.members.form.user')}</label>
                        {/* When editing, prevent changing the user: show static display instead of UserSelect */}
                        {editingMember ? (
                            <div className="w-full rounded-md border bg-background px-3 py-2 text-sm flex items-center gap-2 text-foreground">
                                <Avatar user={assignableUsers.find(u => (u.userId || u.id) === formData.userId) || editingMember} size={8} />
                                <div className="flex-1 min-w-0">
                                    <div className="truncate font-medium text-foreground">{editingMember.userName || editingMember.userEmail}</div>
                                    <div className="text-xs text-muted-foreground truncate">{editingMember.userEmail || ''}</div>
                                </div>
                            </div>
                        ) : (
                            <UserSelect
                                assignableUsers={assignableUsers}
                                value={formData.userId}
                                onChange={(id) => setFormData({ ...formData, userId: id })}
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('projects.detail.members.form.role')}</label>
                        <Select
                            value={formData.roleId}
                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                        >
                            <option value="">{t('projects.detail.members.form.selectRole')}</option>
                            {projectRoles.map(r => (
                                <option key={r.id} value={r.id}>{r.roleName}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('projects.detail.members.form.status')}</label>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                        >
                            <option value="ACTIVE">{t('projects.detail.members.statuses.active')}</option>
                            <option value="INACTIVE">{t('projects.detail.members.statuses.inactive')}</option>
                        </Select>
                    </div>
                </div>
            </Modal>
        </>
    );
}
