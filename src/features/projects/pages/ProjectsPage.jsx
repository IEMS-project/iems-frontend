import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { projectService } from "@/features/projects/api/projectService";
import { toast } from "sonner";
import { columns } from "@/features/projects/components/projects-columns";
import { ProjectsDataTable } from "@/features/projects/components/projects-data-table";
import CreateProjectModal from "@/features/projects/components/CreateProjectModal";
import { cn } from "@/lib/utils";

export default function Projects() {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [editingProject, setEditingProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: ""
    });

    const expectedDeleteText = useMemo(
        () => deletingProject ? `delete ${deletingProject.name}` : "",
        [deletingProject]
    );
    const canDelete = deleteConfirmText.trim() === expectedDeleteText;

    const loadProjects = async () => {
        try {
            setLoading(true);
            const projectsData = await projectService.getMyProjects();
            setProjects(Array.isArray(projectsData) ? projectsData : []);
        } catch (error) {
            console.error("Error loading projects:", error);
            toast.error(error?.message || t("ui.common.error"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleProjectCreated = async () => {
        await loadProjects();
        window.dispatchEvent(new CustomEvent("projects:changed"));
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || "",
            startDate: project.startDate ? project.startDate.toString().split("T")[0] : "",
            endDate: project.endDate ? project.endDate.toString().split("T")[0] : "",
            status: project.status || "PLANNING"
        });
        setShowModal(true);
    };

    const handleDeleteProject = (project) => {
        setDeletingProject(project);
        setDeleteConfirmText("");
        setShowDeleteDialog(true);
    };

    const confirmDeleteProject = async () => {
        if (!deletingProject || !canDelete) return;

        try {
            await projectService.deleteProject(deletingProject.id);
            toast.success(t("projects.messages.deleted"));
            await loadProjects();
            window.dispatchEvent(new CustomEvent("projects:changed", {
                detail: { deletedProjectId: deletingProject.id },
            }));
            setShowDeleteDialog(false);
        } catch (error) {
            console.error("Error deleting project:", error);
            toast.error(error?.message || t("ui.common.error"));
        } finally {
            setDeletingProject(null);
            setDeleteConfirmText("");
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.warning(t("projects.messages.nameRequired"));
            return;
        }

        try {
            const projectData = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
            };

            if (editingProject) {
                await projectService.updateProject(editingProject.id, projectData);
                toast.success(t("projects.messages.updated"));
            } else {
                await projectService.createProject(projectData);
                toast.success(t("projects.messages.created"));
            }

            await loadProjects();
            window.dispatchEvent(new CustomEvent("projects:changed"));

            setShowModal(false);
            setEditingProject(null);
            setFormData({
                name: "",
                description: "",
                startDate: "",
                endDate: "",
                status: ""
            });
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error(error?.message || t("ui.common.error"));
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            status: ""
        });
    };

    return (
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("projects.title")}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t("projects.myProjectsOnly", "Only projects you own or participate in are shown.")}
                            </p>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="mr-1 h-4 w-4" />
                            {t("projects.createProject")}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ProjectsDataTable
                            columns={columns}
                            data={projects}
                            loading={loading}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteProject}
                        />
                    </CardContent>
                </Card>
            </div>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingProject ? t("projects.editProject") : t("projects.createNew")}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>
                            {t("ui.common.cancel")}
                        </Button>
                        <Button onClick={handleSubmit}>
                            {editingProject ? t("ui.common.save") : t("projects.createProject")}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.form.projectName")} {t("projects.form.required")}
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t("projects.form.projectNamePlaceholder")}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t("projects.form.startDate")}</label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t("projects.form.endDate")}</label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.form.status")}
                        </label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded border border-border bg-background p-2 text-sm text-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
                        >
                            <option value="PLANNING">{t("projects.status.planning")}</option>
                            <option value="IN_PROGRESS">{t("projects.status.inProgress")}</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">{t("projects.form.description")}</label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder={t("projects.form.descriptionPlaceholder")}
                        />
                    </div>
                </div>
            </Modal>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("projects.deleteProject")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("projects.messages.deleteConfirm", { name: deletingProject?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Type <span className="font-semibold text-foreground">{expectedDeleteText}</span> to confirm.
                        </p>
                        <Input
                            value={deleteConfirmText}
                            onChange={(event) => setDeleteConfirmText(event.target.value)}
                            placeholder={expectedDeleteText}
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                            {t("ui.common.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteProject}
                            disabled={!canDelete}
                            className={cn("bg-red-600 hover:bg-red-700", !canDelete && "pointer-events-none opacity-50")}
                        >
                            {t("ui.common.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CreateProjectModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleProjectCreated}
            />
        </>
    );
}
