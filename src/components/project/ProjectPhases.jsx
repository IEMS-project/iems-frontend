import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import ConfirmDialog from "../ui/ConfirmDialog";
import { projectService } from "../../services/projectService";
import { toast } from "sonner";
import { Calendar, Target, Trash2, Edit, Plus } from "lucide-react";

export default function ProjectPhases({ projectId }) {
    const { t, i18n } = useTranslation();
    const [phases, setPhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editingPhase, setEditingPhase] = useState(null);
    const [deletingPhase, setDeletingPhase] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        goal: "",
        startDate: "",
        endDate: ""
    });

    const loadPhases = async () => {
        try {
            setLoading(true);
            const data = await projectService.getPhases(projectId);
            setPhases(data);
        } catch (error) {
            console.error("Error loading phases:", error);
            toast.error(t("projects.phases.messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadPhases();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const handleCreatePhase = () => {
        setEditingPhase(null);
        setFormData({
            name: "",
            description: "",
            goal: "",
            startDate: "",
            endDate: ""
        });
        setShowModal(true);
    };

    const handleEditPhase = (phase) => {
        setEditingPhase(phase);
        setFormData({
            name: phase.name,
            description: phase.description || "",
            goal: phase.goal || "",
            startDate: phase.startDate ? new Date(phase.startDate).toISOString().split('T')[0] : "",
            endDate: phase.endDate ? new Date(phase.endDate).toISOString().split('T')[0] : ""
        });
        setShowModal(true);
    };

    const handleDeletePhase = (phase) => {
        setDeletingPhase(phase);
        setShowDeleteDialog(true);
    };

    const confirmDeletePhase = async () => {
        if (!deletingPhase) return;

        try {
            await projectService.deletePhase(projectId, deletingPhase.id);
            toast.success(t("projects.phases.messages.deleted"));
            await loadPhases();
        } catch (error) {
            console.error("Error deleting phase:", error);
            toast.error(error?.message || t("ui.common.error"));
        } finally {
            setDeletingPhase(null);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.warning(t("projects.phases.messages.nameRequired"));
            return;
        }

        try {
            const phaseData = {
                projectId,
                name: formData.name,
                description: formData.description,
                goal: formData.goal,
                startDate: formData.startDate ? `${formData.startDate}T00:00:00` : null,
                endDate: formData.endDate ? `${formData.endDate}T23:59:59` : null
            };

            if (editingPhase) {
                await projectService.updatePhase(projectId, editingPhase.id, phaseData);
                toast.success(t("projects.phases.messages.updated"));
            } else {
                await projectService.createPhase(projectId, phaseData);
                toast.success(t("projects.phases.messages.created"));
            }

            await loadPhases();
            handleClose();
        } catch (error) {
            console.error("Error saving phase:", error);
            toast.error(error?.message || t("ui.common.error"));
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingPhase(null);
        setFormData({
            name: "",
            description: "",
            goal: "",
            startDate: "",
            endDate: ""
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return t("projects.phases.fields.undefined");
        return new Date(dateString).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN');
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">{t("projects.phases.loading")}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("projects.phases.title")}</CardTitle>
                    <Button onClick={handleCreatePhase}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("projects.phases.create")}
                    </Button>
                </CardHeader>
                <CardContent>
                    {phases.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("projects.phases.noPhases")}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {phases.map((phase) => (
                                <div
                                    key={phase.id}
                                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    #{phase.sortOrder}
                                                </span>
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    {phase.name}
                                                </h3>
                                            </div>

                                            {phase.description && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {phase.description}
                                                </p>
                                            )}

                                            {phase.goal && (
                                                <div className="flex items-start gap-2 mb-2">
                                                    <Target className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5" />
                                                    <p className="text-sm text-foreground">
                                                        <span className="font-medium">{t("projects.phases.fields.goal")}</span> {phase.goal}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{t("projects.phases.fields.startDate")} {formatDate(phase.startDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{t("projects.phases.fields.endDate")} {formatDate(phase.endDate)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditPhase(phase)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeletePhase(phase)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingPhase ? t("projects.phases.edit") : t("projects.phases.createNew")}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>
                            {t("ui.common.cancel")}
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingPhase ? t("ui.common.save") : t("projects.phases.create")}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.phases.form.name")} {t("projects.form.required")}
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                            placeholder={t("projects.phases.form.namePlaceholder")}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.phases.form.goal")}
                        </label>
                        <Input
                            type="text"
                            value={formData.goal}
                            onChange={e => setFormData({ ...formData, goal: e.target.value })}
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                            placeholder={t("projects.phases.form.goalPlaceholder")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {t("projects.phases.form.startDate")}
                            </label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {t("projects.phases.form.endDate")}
                            </label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.phases.form.description")}
                        </label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                            placeholder={t("projects.phases.form.descriptionPlaceholder")}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={confirmDeletePhase}
                title={t("projects.phases.delete")}
                description={t("projects.phases.messages.deleteConfirm", { name: deletingPhase?.name })}
                confirmText={t("ui.common.delete")}
                cancelText={t("ui.common.cancel")}
                variant="destructive"
            />
        </>
    );
}
