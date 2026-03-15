import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { projectService } from "@/features/projects/api/projectService";
import { toast } from "sonner";
import { columns } from "@/features/projects/components/projects-columns";
import { ProjectsDataTable } from "@/features/projects/components/projects-data-table";
import CreateProjectModal from "@/features/projects/components/CreateProjectModal";

export default function Projects() {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: ""
    });

    // Load projects and users on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const projectsData = await projectService.getProjectsTable();
                setProjects(projectsData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleCreateProject = () => {
        setShowCreateModal(true);
    };

    const handleProjectCreated = async () => {
        const updatedProjects = await projectService.getProjectsTable();
        setProjects(updatedProjects);
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || "",
            startDate: project.startDate ? project.startDate.toString().split('T')[0] : "",
            endDate: project.endDate ? project.endDate.toString().split('T')[0] : "",
            status: project.status || "PLANNING"
        });
        setShowModal(true);
    };

    const handleDeleteProject = (project) => {
        setDeletingProject(project);
        setShowDeleteDialog(true);
    };

    const confirmDeleteProject = async () => {
        if (!deletingProject) return;

        try {
            await projectService.deleteProject(deletingProject.id);
            toast.success(t("projects.messages.deleted"));

            // Reload projects
            const updatedProjects = await projectService.getProjectsTable();
            setProjects(updatedProjects);
        } catch (error) {
            console.error("Error deleting project:", error);
            toast.error(error?.message || t("ui.common.error"));
        } finally {
            setDeletingProject(null);
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

            // Reload projects
            const updatedProjects = await projectService.getProjectsTable();
            setProjects(updatedProjects);

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
                        <CardTitle>{t("projects.title")}</CardTitle>
                        <Button onClick={handleCreateProject}>{t("projects.createProject")}</Button>
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
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
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
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t("projects.form.endDate")}</label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.form.status")}
                        </label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
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
                            className="w-full rounded border border-border bg-background text-foreground p-2 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                            placeholder={t("projects.form.descriptionPlaceholder")}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={confirmDeleteProject}
                title={t("projects.deleteProject")}
                description={t("projects.messages.deleteConfirm", { name: deletingProject?.name })}
                confirmText={t("ui.common.delete")}
                cancelText={t("ui.common.cancel")}
                variant="destructive"
            />

            <CreateProjectModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleProjectCreated}
            />
        </>
    );
}
