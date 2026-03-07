import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import { Trash2 } from "lucide-react";
import IconActionButton from "../ui/IconActionButton";
import { useParams } from "react-router-dom";
import { projectService } from "../../services/projectService";
import Skeleton from "../ui/Skeleton";
import ConfirmDialog from "../ui/ConfirmDialog";
import { toast } from "sonner";

export default function ProjectRoles() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ roleName: "" });
    const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProjectRoles(projectId);
            setRoles(Array.isArray(data) ? data : []);
        } catch (_e) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (projectId) load(); }, [projectId]);

    const openAdd = async () => {
        setEditing(null);
        setForm({ roleName: "" });
        setShowModal(true);
    };
    const openEdit = (r) => {
        setEditing(r);
        setForm({ roleName: r.roleName || "" });
        setShowModal(true);
    };
    const onSubmit = async () => {
        try {
            const roleName = form.roleName.trim();
            if (!roleName) {
                toast.warning(t('projects.detail.roles.messages.roleRequired'));
                return;
            }
            await projectService.addProjectRole(projectId, { roleName });
            setShowModal(false);
            await load();
            toast.success(t('projects.detail.roles.messages.addSuccess'));
            // Trigger event to notify other components about role changes
            window.dispatchEvent(new CustomEvent('projectRolesUpdated', { detail: { projectId } }));
        } catch (e) {
            console.error("Error adding role:", e);
            const errorMessage = e?.message || t('projects.detail.roles.messages.addError');
            toast.error(errorMessage);
        }
    };
    const onDelete = (r) => {
        setRoleToDelete(r);
        setDeleteRoleDialogOpen(true);
    };

    const confirmDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            await projectService.deleteProjectRole(projectId, roleToDelete.id);
            await load();
            toast.success(t('projects.detail.roles.messages.deleteSuccess'));
            setDeleteRoleDialogOpen(false);
            setRoleToDelete(null);
        } catch (e) {
            console.error("Error deleting role:", e);
            setDeleteRoleDialogOpen(false);
            setRoleToDelete(null);

            // Check for specific error about role being assigned
            if (e?.message?.includes("already assigned") || e?.message?.includes("ROLE_ALREADY_ASSIGNED")) {
                toast.error(t('projects.detail.roles.messages.roleAlreadyAssigned'));
            } else {
                const errorMessage = e?.message || t('projects.detail.roles.messages.deleteError');
                toast.error(errorMessage);
            }
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{t('projects.detail.roles.title')}</CardTitle>
                        <Button size="sm" onClick={openAdd}>+ {t('projects.detail.roles.add')}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-44 overflow-y-auto">
                        {loading ? (
                            <ul className="space-y-2">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <li key={idx} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-32" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-10" />
                                            <Skeleton className="h-4 w-10" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : roles.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">{t('projects.detail.roles.noRoles')}</div>
                        ) : (
                            <ul className="space-y-2">
                                {roles.map(r => (
                                    <li key={r.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium">{r.roleName}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconActionButton
                                                icon={Trash2}
                                                label={t('projects.detail.roles.delete')}
                                                variant="danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(r);
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editing ? t('projects.detail.roles.modal.editTitle') : t('projects.detail.roles.modal.addTitle')}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>{t('ui.common.cancel')}</Button>
                        <Button onClick={onSubmit}>{editing ? t('ui.common.save') : t('ui.common.add')}</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.detail.roles.form.roleName')}</label>
                        <Input
                            type="text"
                            value={form.roleName}
                            onChange={(e) => setForm({ roleName: e.target.value })}
                            className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder={t('projects.detail.roles.form.roleNamePlaceholder') || 'Enter role name'}
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Role Confirmation Dialog */}
            <ConfirmDialog
                open={deleteRoleDialogOpen}
                onOpenChange={(open) => {
                    setDeleteRoleDialogOpen(open);
                    if (!open) setRoleToDelete(null);
                }}
                onConfirm={confirmDeleteRole}
                title={t('projects.detail.roles.modal.deleteTitle')}
                description={t('projects.detail.roles.messages.deleteConfirm')}
                confirmText={t('ui.common.delete')}
                cancelText={t('ui.common.cancel')}
                variant="destructive"
            />
        </>
    );
}


