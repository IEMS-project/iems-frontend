import React, { useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import UserSelect from "./UserSelect";
import { projectService } from "@/features/projects/api/projectService";
import { userService } from "@/features/profile/api/userService";
import { useAuth } from "@/context/AuthContext";
import { ProjectProvider, useProject } from "@/features/projects/context/ProjectContext";
import ProjectAvatar from "@/features/projects/components/ProjectAvatar";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import Skeleton from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getStatusTranslationKey } from "@/lib/i18n";
import {
    Pencil, LayoutDashboard, Layers, Kanban, CheckSquare, Bot, CalendarDays,
    LineChart, Repeat, Users, Settings, GitBranch, FileText, Camera, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DndContext, PointerSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext, useSortable,
    horizontalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DEFAULT_TABS = [
    { id: "overview", label: "overview", path: "overview" },
    { id: "backlog", label: "backlog", path: "backlog" },
    { id: "board", label: "board", path: "board" },
    { id: "tasks", label: "tasks", path: "tasks" },
    { id: "agent", label: "agent", path: "agent" },
    { id: "timeline", label: "timeline", path: "timeline" },
    { id: "burndown", label: "burndown", path: "burndown", premiumOnly: true },
    { id: "sprints", label: "sprints", path: "sprints" },
    { id: "members", label: "members", path: "members" },
    { id: "settings", label: "settings", path: "settings" },
    { id: "code", label: "code", path: "code" },
    { id: "documents", label: "documents", path: "documents" },
];

const tabIcons = {
    overview: LayoutDashboard,
    backlog: Layers,
    board: Kanban,
    tasks: CheckSquare,
    agent: Bot,
    timeline: CalendarDays,
    burndown: LineChart,
    sprints: Repeat,
    members: Users,
    settings: Settings,
    code: GitBranch,
    documents: FileText,
};

const tabTitleMap = {
    overview: "Overview",
    backlog: "Backlog",
    board: "Board",
    tasks: "Issues",
    agent: "AI Assistant",
    timeline: "Timeline",
    burndown: "Burndown",
    sprints: "Sprints",
    members: "Members",
    settings: "Settings",
    code: "Code",
    documents: "Documents",
};

// ── Draggable/Reorderable tab component ──────────────────────────────────────────
function SortableTab({ tab, isActive, labelText, onClick }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging
    } = useSortable({ id: tab.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const IconComponent = tabIcons[tab.id];

    return (
        <button
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            aria-label={labelText}
            aria-current={isActive ? "page" : undefined}
            {...attributes}
            {...listeners}
            className={cn(
                "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 cursor-pointer select-none",
                isActive
                    ? "border-blue-500 text-white-600 dark:text-blue-400 font-semibold bg-blue-50/40 dark:bg-blue-950/10"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/30",
                isDragging ? "opacity-40 scale-95 shadow-md border-blue-400 bg-background z-50" : "hover:scale-[1.01]"
            )}
        >
            {IconComponent && <IconComponent className="w-4 h-4 shrink-0" />}
            {labelText}
        </button>
    );
}

function ProjectDetailLayoutContent() {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile } = useAuth();

    const [orderedTabs, setOrderedTabs] = useState(() => {
        const saved = localStorage.getItem(`iems-project-${projectId}-tabs-order`);
        if (saved) {
            try {
                const savedIds = JSON.parse(saved);
                if (Array.isArray(savedIds)) {
                    const ordered = [];
                    savedIds.forEach(id => {
                        const tab = DEFAULT_TABS.find(t => t.id === id);
                        if (tab) ordered.push(tab);
                    });
                    DEFAULT_TABS.forEach(tab => {
                        if (!ordered.some(t => t.id === tab.id)) {
                            ordered.push(tab);
                        }
                    });
                    return ordered;
                }
            } catch (e) {
                console.error("Failed to parse saved tab order:", e);
            }
        }
        return DEFAULT_TABS;
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;

        setOrderedTabs((prev) => {
            const oldIndex = prev.findIndex((t) => t.id === active.id);
            const newIndex = prev.findIndex((t) => t.id === over.id);
            const next = arrayMove(prev, oldIndex, newIndex);
            localStorage.setItem(`iems-project-${projectId}-tabs-order`, JSON.stringify(next.map(t => t.id)));
            return next;
        });
    };

    // Get data from ProjectContext
    const { projectData, projectError, loading, refreshProject } = useProject();
    const avatarInputRef = useRef(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [projectAvatarSrc, setProjectAvatarSrc] = useState("");

    // Edit project modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [editAvatarFile, setEditAvatarFile] = useState(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState("");
    const editAvatarInputRef = useRef(null);
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
        if (path.includes("/backlog")) return "backlog";
        if (path.includes("/board")) return "board";
        if (path.includes("/tasks")) return "tasks";
        if (path.includes("/agent")) return "agent";
        if (path.includes("/timeline")) return "timeline";
        if (path.includes("/burndown")) return "burndown";
        if (path.includes("/sprints")) return "sprints";
        if (path.includes("/members")) return "members";
        if (path.includes("/settings")) return "settings";
        if (path.includes("/code")) return "code";
        if (path.includes("/documents")) return "documents";
        return "overview";
    }, [location.pathname]);

    const projectTitle = projectData?.name
        ? `${projectData.name} - ${tabTitleMap[currentTab] || "Project"}`
        : `Project - ${tabTitleMap[currentTab] || "Project"}`;
    useDocumentTitle(projectTitle);

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
        setEditAvatarFile(null);
        setEditAvatarPreview(projectAvatarSrc || projectData?.avatarUrl || "");
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
            if (editAvatarFile) {
                await projectService.uploadProjectAvatar(projectId, editAvatarFile);
            }
            toast.success(t("projects.messages.updated"));

            // Reload project data using context
            await refreshProject();

            setShowEditModal(false);
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error(error?.message || t("ui.common.error"));
        }
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditAvatarFile(null);
        setEditAvatarPreview("");
        if (editAvatarInputRef.current) editAvatarInputRef.current.value = "";
    };

    const handleEditAvatarChange = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.warning("Please choose an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.warning("Avatar image must be 5MB or smaller");
            return;
        }
        setEditAvatarFile(file);
        setEditAvatarPreview(URL.createObjectURL(file));
    };

    const handleProjectAvatarChange = async (file) => {
        if (!file || !projectId || avatarUploading) return;
        if (!file.type.startsWith("image/")) {
            toast.warning("Please choose an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.warning("Avatar image must be 5MB or smaller");
            return;
        }

        try {
            setAvatarUploading(true);
            await projectService.uploadProjectAvatar(projectId, file);
            toast.success("Project avatar updated");
            await refreshProject();
        } catch (error) {
            toast.error(error?.message || "Failed to upload project avatar");
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = "";
        }
    };

    React.useEffect(() => {
        let cancelled = false;
        const loadProjectAvatar = async () => {
            if (!projectData?.id) {
                setProjectAvatarSrc("");
                return;
            }

            try {
                const avatarUrl = await projectService.getProjectAvatarUrl(projectData.id);
                if (!cancelled) setProjectAvatarSrc(avatarUrl || projectData.avatarUrl || "");
            } catch {
                if (!cancelled) setProjectAvatarSrc(projectData.avatarUrl || "");
            }
        };

        loadProjectAvatar();
        return () => {
            cancelled = true;
        };
    }, [projectData?.id, projectData?.avatarUrl]);

    if (projectError && !loading) {
        return (
            <div className="flex h-full min-h-[420px] items-center justify-center p-6">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h1 className="mt-4 text-xl font-semibold text-foreground">
                        {projectError.status === 404 ? "Project not found" : "Unable to load project"}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {projectError.status === 404
                            ? "The project URL is invalid or this project no longer exists."
                            : projectError.message}
                    </p>
                    <div className="mt-5 flex justify-center gap-2">
                        <Button variant="secondary" onClick={() => navigate("/projects")}>
                            Back to projects
                        </Button>
                        {projectError.status !== 404 && (
                            <Button onClick={refreshProject}>
                                Try again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Project Header with Tab Navigation - Fixed */}
            <div className="shrink-0 border-b border-border bg-background z-10">
                {/* Row 1: Project Info */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-6">
                    <div className="flex flex-col gap-1 min-w-0">

                        {loading && !projectData ? (
                            <div className="flex items-center gap-3 min-w-0 mt-1">
                                <Skeleton className="h-7 w-48" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        ) : (
                            <div className="flex min-w-0 flex-wrap items-center gap-3 mt-0.5">
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md">
                                    <ProjectAvatar project={projectData} src={projectAvatarSrc} size={11} className="h-full w-full" />
                                    {canEditProject && (
                                        <button
                                            type="button"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={avatarUploading}
                                            className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition hover:bg-black/45 hover:opacity-100 disabled:cursor-not-allowed"
                                            title="Upload project avatar"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleProjectAvatarChange(e.target.files?.[0])}
                                />
                                <h1 className="min-w-0 max-w-full truncate text-xl font-bold text-foreground tracking-tight select-all sm:text-2xl">{projectData?.name || '-'}</h1>
                                <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="blue" className="whitespace-nowrap px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-none">
                                        {projectData?.status ? t(getStatusTranslationKey(projectData.status)) : t('dashboard.status.unknown')}
                                    </Badge>
                                    {canEditProject && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEditProject}
                                            className="ml-1 h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title={t("projects.editProject")}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: Draggable Tab Navigation */}
                <div className="border-t border-border/30 bg-muted/5 px-4 sm:px-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedTabs.map(t => t.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            <nav className="flex max-w-full items-center gap-1 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:thin]" aria-label="Tabs">
                                {orderedTabs
                                    .filter(tab => !tab.premiumOnly || projectData?.ownerSubscription === "PREMIUM")
                                    .map((tab) => (
                                        <SortableTab
                                            key={tab.id}
                                            tab={tab}
                                            isActive={currentTab === tab.id}
                                            labelText={t(`projects.detail.tabs.${tab.label}`)}
                                            onClick={() => handleTabClick(tab.path)}
                                        />
                                    ))}
                            </nav>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* Page Content */}
            {currentTab === "agent" ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Outlet context={{ projectData, loading }} />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <Outlet context={{ projectData, loading }} />
                    </div>
                </div>
            )}

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
                    <div className="sm:col-span-2 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => editAvatarInputRef.current?.click()}
                            className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted text-sm font-semibold text-muted-foreground hover:bg-accent"
                            title="Choose project avatar"
                        >
                            {editAvatarPreview ? (
                                <ProjectAvatar project={projectData} src={editAvatarPreview} name={formData.name} size="xl" className="h-full w-full border-0 shadow-none" />
                            ) : (
                                <span>{(formData.name || "P").trim().slice(0, 2).toUpperCase()}</span>
                            )}
                        </button>
                        <div className="min-w-0">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Project Avatar
                            </label>
                            <Button type="button" variant="secondary" onClick={() => editAvatarInputRef.current?.click()}>
                                Choose Image
                            </Button>
                            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP up to 5MB</p>
                        </div>
                        <input
                            ref={editAvatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleEditAvatarChange(e.target.files?.[0])}
                        />
                    </div>

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

// Wrapper component that provides ProjectContext
export default function ProjectDetailLayout() {
    return (
        <ProjectProvider>
            <ProjectDetailLayoutContent />
        </ProjectProvider>
    );
}

