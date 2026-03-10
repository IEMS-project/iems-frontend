import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import UserSelect from "./UserSelect";
import { projectService } from "@/features/projects/api/projectService";
import { userService } from "@/features/profile/api/userService";
import { useErrorHandler } from "@/components/common/ErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { getStatusTranslationKey } from "@/lib/i18n";
import { Pencil } from "lucide-react";

const tabs = [
    { id: "overview", label: "overview", path: "overview" },
    { id: "timeline", label: "timeline", path: "timeline" },
    { id: "phases", label: "phases", path: "phases" },
    { id: "tasks", label: "tasks", path: "tasks" },
    { id: "members", label: "members", path: "members" },
    { id: "code", label: "code", path: "code" },
];

export default function ProjectDetailLayout() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { handleError } = useErrorHandler();
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [projectData, setProjectData] = useState(null);
    
    // Edit project modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        managerId: "",
        status: ""
    });

    // Check if current user can edit project (admin, super_admin, or project manager)
    const canEditProject = useMemo(() => {
        if (!userProfile || !projectData) return false;
        
        const userRole = userProfile.role?.toUpperCase() || "";
        const isAdmin = ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"].includes(userRole);
        const isProjectManager = projectData.managerId === userProfile.id;
        
        return isAdmin || isProjectManager;
    }, [userProfile, projectData]);

    // Determine current tab from path
    const currentTab = React.useMemo(() => {
        const path = location.pathname;
        if (path.includes("/members")) return "members";
        if (path.includes("/tasks")) return "tasks";
        if (path.includes("/timeline")) return "timeline";
        if (path.includes("/phases")) return "phases";
        if (path.includes("/code")) return "code";
        return "overview";
    }, [location.pathname]);

    // Only load project data once when projectId changes, not on tab changes
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await projectService.getProjectById(projectId);

                if (data && data.status === "error" &&
                    (data.message?.includes("Permission denied") ||
                        data.message?.includes("PERMISSION_DENIED"))) {
                    navigate("/permission-denied");
                    return;
                }

                setProjectData(data);
            } catch (e) {
                if (e.status === 403 ||
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    navigate("/permission-denied");
                    return;
                } else {
                    handleError(e);
                }
            } finally {
                setLoading(false);
            }
        };
        if (projectId) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]); // Only reload when projectId changes, not on tab navigation

    const handleTabClick = (tabPath) => {
        navigate(`/projects/${projectId}/${tabPath}`);
    };

    // Handle edit project
    const handleEditProject = async () => {
        try {
            // Load users for manager select (only ADMIN and PROJECT_MANAGER roles)
            const usersData = await userService.getProjectManagerCandidates();
            setUsers(usersData);
        } catch (error) {
            console.error("Error loading users:", error);
        }
        
        setFormData({
            name: projectData?.name || "",
            description: projectData?.description || "",
            startDate: projectData?.startDate ? projectData.startDate.toString().split('T')[0] : "",
            endDate: projectData?.endDate ? projectData.endDate.toString().split('T')[0] : "",
            managerId: projectData?.managerId || "",
            status: projectData?.status || "PLANNING"
        });
        setShowEditModal(true);
    };

    const handleSubmitEdit = async () => {
        if (!formData.name.trim()) {
            toast.warning(t("projects.messages.nameRequired"));
            return;
        }
        if (!formData.managerId) {
            toast.warning(t("projects.messages.managerRequired"));
            return;
        }

        try {
            const projectDataToSave = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
            };

            await projectService.updateProject(projectId, projectDataToSave);
            toast.success(t("projects.messages.updated"));

            // Reload project data
            const updatedProject = await projectService.getProjectById(projectId);
            setProjectData(updatedProject);

            setShowEditModal(false);
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error(error?.message || t("ui.common.error"));
        }
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
    };


    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Project Header with Tab Navigation - Fixed */}
            <div className="shrink-0 border-b border-border bg-background z-10">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                    {/* Project Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {loading && !projectData ? (
                            <div className="flex items-center gap-3 min-w-0">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-xl font-bold truncate text-foreground">{projectData?.name || '-'}</h1>
                                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className=" text-xl font-bold ">-</span>
                                    <Badge variant="blue" className="whitespace-nowrap">
                                        {projectData?.status ? t(getStatusTranslationKey(projectData.status)) : t('dashboard.status.unknown')}
                                    </Badge>
                                    {canEditProject && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEditProject}
                                            className="ml-2"
                                            title={t("projects.editProject")}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <nav className="flex items-center gap-1" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const isActive = currentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.path)}
                                    className={`
                                        whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors
                                        ${isActive
                                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                                        }
                                    `}
                                >
                                    {t(`projects.detail.tabs.${tab.label}`)}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Page Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <Outlet context={{ projectData, loading }} />
                </div>
            </div>

            {/* Edit Project Modal */}
            <Modal
                open={showEditModal}
                onClose={handleCloseEditModal}
                title={t("projects.editProject")}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleCloseEditModal}>
                            {t("ui.common.cancel")}
                        </Button>
                        <Button onClick={handleSubmitEdit}>
                            {t("ui.common.save")}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
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
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t("projects.form.projectManager")} {t("projects.form.required")}
                        </label>
                        <UserSelect
                            assignableUsers={users}
                            value={formData.managerId}
                            onChange={(userId) => setFormData({ ...formData, managerId: userId })}
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
                            <option value="ON_HOLD">{t("projects.status.onHold")}</option>
                            <option value="COMPLETED">{t("projects.status.completed")}</option>
                            <option value="CANCELLED">{t("projects.status.cancelled")}</option>
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
        </div>
    );
}

