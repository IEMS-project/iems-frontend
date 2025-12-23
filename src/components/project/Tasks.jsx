import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/select";
import { useParams, useNavigate } from "react-router-dom";
import { taskService } from "../../services/taskService";
import { projectService } from "../../services/projectService";
import UserSelect from "./UserSelect";
import PhaseSelect from "./PhaseSelect";
import TaskDetailModal from "../tasks/TaskDetailModal";
import { toast } from "sonner";
import { taskColumns } from "./tasks-columns";
import { TasksDataTable } from "./tasks-data-table";
import { translatePriority, translateStatus, reverseTranslateStatus, reverseTranslatePriority } from "../../lib/i18n";
import RichTextEditor from "../ui/RichTextEditor";
import { getTaskTypeIcon, getTaskTypeColor } from "../../lib/taskTypeUtils";
import { CheckSquare, Bug, BookOpen, Zap, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Equal, Paperclip, Type, FileText, Layers, GitBranch, Milestone, User, Clock, Flag, Calendar, CalendarClock } from 'lucide-react';
export default function Tasks({ tasks: tasksProp, onTasksChange, tasksLoading = false }) {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tasksData, setTasksData] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [phases, setPhases] = useState([]);
    const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

    // Danh sách thành viên trong dự án để chọn làm người phụ trách
    // Tải từ API dự án

    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailTask, setDetailTask] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const taskTypeOptions = [
        { value: 'EPIC', label: t('projects.detail.tasks.taskTypes.epic'), icon: Zap, color: getTaskTypeColor('EPIC') },
        { value: 'TASK', label: t('projects.detail.tasks.taskTypes.task'), icon: CheckSquare, color: getTaskTypeColor('TASK') },
        { value: 'STORY', label: t('projects.detail.tasks.taskTypes.story'), icon: BookOpen, color: getTaskTypeColor('STORY') },
        { value: 'BUG', label: t('projects.detail.tasks.taskTypes.bug'), icon: Bug, color: getTaskTypeColor('BUG') },
    ];

    const priorityOptions = [
        { value: 'Cao', label: t('dashboard.priority.high'), icon: ChevronUp, color: 'text-red-600 dark:text-red-400' },
        { value: 'Trung bình', label: t('dashboard.priority.medium'), icon: Equal, color: 'text-yellow-600 dark:text-yellow-400' },
        { value: 'Thấp', label: t('dashboard.priority.low'), icon: ChevronDown, color: 'text-blue-600 dark:text-blue-400' },
    ];

    const [formData, setFormData] = useState({
        id: "",
        title: "",
        description: "",
        assignee: "",
        status: "Đang chờ",
        priority: "Trung bình",
        taskType: "TASK",
        parentTaskId: "",
        phaseId: "",
        startDate: "",
        dueDate: ""
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [data, members, phasesData] = await Promise.all([
                    tasksProp ? Promise.resolve(tasksProp) : taskService.getTasksByProject(projectId),
                    projectService.getProjectMembers(projectId),
                    projectService.getPhases(projectId)
                ]);

                // Check if response indicates permission error
                if (data && data.status === "error" &&
                    (data.message?.includes("Permission denied") ||
                        data.message?.includes("PERMISSION_DENIED"))) {
                    console.log("Permission error in Tasks response data, redirecting...");
                    navigate("/permission-denied");
                    return;
                }

                const nextTasks = Array.isArray(data) ? data : [];
                setTasksData(nextTasks);
                if (onTasksChange && !tasksProp) onTasksChange(nextTasks);

                setPhases(Array.isArray(phasesData) ? phasesData : []);

                const users = Array.isArray(members) ? members.map(m => ({
                    // preserve original fields and also normalize common keys
                    id: m.userId || m.id,
                    userId: m.userId || m.id,
                    userName: m.userName || m.userName,
                    fullName: m.userName || m.userEmail,
                    email: m.userEmail,
                    // pass through possible image fields so Avatar can detect them
                    userImage: m.userImage || m.image || m.avatar || null,
                    image: m.userImage || m.image || m.avatar || null,
                    avatar: m.userImage || m.image || m.avatar || null,
                    // include original object for maximum flexibility
                    __raw: m
                })) : [];
                setAssignableUsers(users);
            } catch (e) {
                console.log("Tasks Error:", e);
                console.log("Error status:", e.status);
                console.log("Error message:", e.message);
                console.log("Error data:", e.data);

                // Check if it's a permission error
                if (e.status === 403 ||
                    e.message?.includes("PERMISSION_DENIED") ||
                    e.message?.includes("permission") ||
                    e.message?.includes("quyền") ||
                    e.message?.includes("Permission denied")) {
                    console.log("Permission error detected in Tasks, redirecting...");
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
    }, [projectId, navigate, tasksProp]);

    const handleEditTask = (task) => {
        setEditingTask(task);
        const assignedId = task.assignedTo?.id || task.assignedTo || "";
        const statusForSelect = translateStatus(task.status) || 'Đang chờ';
        setFormData({
            id: task.id,
            title: task.title,
            description: task.description || "",
            assignee: assignedId,
            status: statusForSelect,
            priority: translatePriority(task.priority) || "Trung bình",
            taskType: (task.taskType || '').toString().toUpperCase().includes('EPIC') ? 'EPIC'
                : (task.taskType || '').toString().toUpperCase().includes('STORY') ? 'STORY'
                    : (task.taskType || '').toString().toUpperCase().includes('BUG') ? 'BUG'
                        : 'TASK',
            parentTaskId: task.parentTaskId || "",
            phaseId: task.phaseId || "",
            startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : "",
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
        });
        setExistingAttachments(task.attachments || []);
        setAttachmentsToDelete([]);
        setSelectedFiles([]);
        setShowModal(true);
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setSelectedFiles([]);
        setExistingAttachments([]);
        setAttachmentsToDelete([]);
        setFormData({
            id: "",
            title: "",
            description: "",
            assignee: "",
            status: "Đang chờ",
            priority: "Trung bình",
            taskType: "TASK",
            parentTaskId: "",
            phaseId: "",
            startDate: "",
            dueDate: ""
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (!formData.title.trim()) {
                toast.warning(t('projects.detail.tasks.messages.titleRequired'));
                return;
            }
            if (!formData.assignee) {
                toast.warning(t('projects.detail.tasks.messages.assigneeRequired'));
                return;
            }
            if (!formData.dueDate) {
                toast.warning(t('projects.detail.tasks.messages.dueDateRequired'));
                return;
            }

            const payload = {
                projectId,
                title: formData.title.trim(),
                description: formData.description?.trim() || undefined,
                assignedTo: formData.assignee,
                status: reverseTranslateStatus(formData.status),
                priority: reverseTranslatePriority(formData.priority),
                taskType: formData.taskType,
                parentTaskId: formData.parentTaskId || null,
                phaseId: formData.phaseId || null,
                startDate: formData.startDate || undefined,
                dueDate: formData.dueDate,
            };

            if (editingTask?.id) {
                // Delete attachments first if any
                if (attachmentsToDelete.length > 0) {
                    await Promise.all(
                        attachmentsToDelete.map(attachmentId =>
                            taskService.deleteAttachment(editingTask.id, attachmentId)
                        )
                    );
                }

                // Then update task with new files
                await taskService.updateTask(editingTask.id, payload, selectedFiles);

                toast.success(t('projects.detail.tasks.messages.updated'));
            } else {
                await taskService.createTask(payload, selectedFiles.length > 0 ? selectedFiles : null);
                toast.success(t('projects.detail.tasks.messages.created'));
            }

            const refreshed = await taskService.getTasksByProject(projectId);
            const list = Array.isArray(refreshed) ? refreshed : [];
            setTasksData(list);
            if (onTasksChange) onTasksChange(list);

            setShowModal(false);
            setFormData({
                id: "",
                title: "",
                description: "",
                assignee: "",
                status: "Đang chờ",
                priority: "Trung bình",
                taskType: "TASK",
                parentTaskId: "",
                startDate: "",
                dueDate: ""
            });
        } catch (e) {
            console.error("Error saving task:", e);
            if (e.status === 403 ||
                e.message?.includes("PERMISSION_DENIED") ||
                e.message?.includes("permission") ||
                e.message?.includes("quyền") ||
                e.message?.includes("Permission denied")) {
                navigate("/permission-denied");
                return;
            } else {
                toast.error(e?.message || "An error occurred while saving the task");
            }
        } finally {
            setLoading(false);
        }
    };

    const showLoading = loading || tasksLoading;

    const handleClose = () => {
        setShowModal(false);
        setSelectedFiles([]);
        setExistingAttachments([]);
        setAttachmentsToDelete([]);
        setFormData({
            id: "",
            title: "",
            assignee: "",
            status: "Đang chờ",
            priority: "Trung bình",
            taskType: "TASK",
            parentTaskId: "",
            phaseId: "",
            dueDate: ""
        });
    };

    const handleRowClick = (task) => {
        setDetailTask(task);
        setShowDetail(true);
    };

    const handleDeleteTask = (task) => {
        setTaskToDelete(task);
        setShowDeleteConfirm(true);
        setShowDetail(false);
    };

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            setLoading(true);
            await taskService.deleteTask(taskToDelete.id);
            toast.success(t('projects.detail.tasks.messages.deleted'));
            
            const refreshed = await taskService.getTasksByProject(projectId);
            const list = Array.isArray(refreshed) ? refreshed : [];
            setTasksData(list);
            if (onTasksChange) onTasksChange(list);
        } catch (e) {
            console.error("Error deleting task:", e);
            if (e.status === 403 ||
                e.message?.includes("PERMISSION_DENIED") ||
                e.message?.includes("permission") ||
                e.message?.includes("quyền") ||
                e.message?.includes("Permission denied")) {
                navigate("/permission-denied");
                return;
            } else {
                toast.error(e?.message || t('projects.detail.tasks.messages.deleteError'));
            }
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
            setTaskToDelete(null);
        }
    };

    const isImageFile = (file) => {
        if (file instanceof File) {
            return file.type.startsWith('image/');
        }
        // For existing attachments
        const fileName = file.fileName || file.name || '';
        return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
    };

    const getFilePreview = (file) => {
        if (file instanceof File) {
            return URL.createObjectURL(file);
        }
        return file.fileUrl || file.url || '';
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (attachmentId) => {
        setAttachmentsToDelete(prev => [...prev, attachmentId]);
        setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
    };

    // Map phaseId to phaseName for display in table
    const tasksWithPhaseName = tasksData.map(task => {
        const phaseName = task.phaseId && phases.length > 0
            ? (phases.find(p => p.id === task.phaseId)?.name || '')
            : '';
        return {
            ...task,
            phaseName
        };
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{t('projects.detail.tasks.title')}</CardTitle>
                        <Button size="sm" onClick={handleAddTask}>+ {t('projects.detail.tasks.actions.addTask')}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <TasksDataTable
                        columns={taskColumns}
                        data={tasksWithPhaseName}
                        loading={showLoading}
                        onRowClick={handleRowClick}
                    />
                </CardContent>
            </Card>

            <Modal
                open={showModal}
                onClose={handleClose}
                title={editingTask ? t('projects.detail.tasks.modal.editTitle') : t('projects.detail.tasks.modal.addTitle')}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={handleClose}>{t('ui.common.cancel')}</Button>
                        <Button onClick={handleSubmit}>
                            {editingTask ? t('ui.common.save') : t('ui.common.add')}
                        </Button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left side - Description & Attachments */}
                    <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2 pl-2">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <Type className="w-4 h-4" />
                                {t('projects.detail.tasks.form.title')}
                            </label>
                            <Input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full"
                                placeholder={t('projects.detail.tasks.form.titlePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <FileText className="w-4 h-4" />
                                {t('projects.detail.tasks.form.description')}
                            </label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                                placeholder={t('projects.detail.tasks.form.descriptionPlaceholder')}
                            />
                        </div>

                        {/* Attachments section moved here */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                                <Paperclip className="w-4 h-4" />
                                {t('projects.detail.tasks.form.attachments') || 'File đính kèm'}
                            </label>

                            {/* Existing attachments */}
                            {existingAttachments.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-xs text-muted-foreground mb-2">File hiện có:</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Hiển thị ảnh trước */}
                                        {existingAttachments
                                            .filter(attachment => isImageFile(attachment))
                                            .map((attachment) => (
                                                <div key={attachment.id} className="relative group aspect-square">
                                                    <img
                                                        src={getFilePreview(attachment)}
                                                        alt={attachment.fileName}
                                                        className="w-full h-full object-cover rounded border border-gray-200 dark:border-gray-700"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingAttachment(attachment.id)}
                                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        title="Xóa file"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}

                                        {/* Hiển thị file thường sau */}
                                        {existingAttachments
                                            .filter(attachment => !isImageFile(attachment))
                                            .map((attachment) => (
                                                <div key={attachment.id} className="col-span-3 flex items-center gap-2 p-2 bg-muted rounded border border-border">
                                                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-foreground truncate" title={attachment.fileName}>
                                                            {attachment.fileName}
                                                        </div>
                                                        <a
                                                            href={attachment.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                        >
                                                            Xem file
                                                        </a>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingAttachment(attachment.id)}
                                                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        title="Xóa file"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* New files to upload */}
                            {selectedFiles.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-xs text-muted-foreground mb-2">File mới:</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Hiển thị ảnh trước */}
                                        {selectedFiles
                                            .map((file, index) => ({ file, index }))
                                            .filter(({ file }) => isImageFile(file))
                                            .map(({ file, index }) => (
                                                <div key={index} className="relative group aspect-square">
                                                    <img
                                                        src={getFilePreview(file)}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover rounded border border-blue-200 dark:border-blue-800"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSelectedFile(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        title="Xóa file"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}

                                        {/* Hiển thị file thường sau */}
                                        {selectedFiles
                                            .map((file, index) => ({ file, index }))
                                            .filter(({ file }) => !isImageFile(file))
                                            .map(({ file, index }) => (
                                                <div key={index} className="col-span-3 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-foreground truncate" title={file.name}>
                                                            {file.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {(file.size / 1024).toFixed(2)} KB
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSelectedFile(index)}
                                                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        title="Xóa file"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* File input */}
                            <div className="relative">
                                <Input
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        setSelectedFiles(prev => [...prev, ...newFiles]);
                                        e.target.value = ''; // Reset input để có thể chọn lại cùng file
                                    }}
                                    className="w-full"
                                    accept="*/*"
                                    id="file-upload"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right side - Details */}
                    <div className="lg:col-span-1 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4 pr-2 pl-2">
                        <div className="text-sm font-semibold text-foreground mb-3">{t('tasks.detail.fields.details')}</div>

                        {editingTask && (
                            <div>
                                <div className="text-xs uppercase text-muted-foreground">{t('tasks.detail.fields.project')}</div>
                                <div className="text-sm text-foreground mt-1">
                                    {(editingTask.project && editingTask.project.name) || editingTask.projectName || '-'}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <Layers className="w-4 h-4" />
                                {t('projects.detail.tasks.form.taskType')}
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskTypeDropdown(!showTaskTypeDropdown)}
                                    className="w-full px-3 py-2 pl-9 text-left border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        {taskTypeOptions.find(opt => opt.value === formData.taskType)?.label || t('projects.detail.tasks.form.taskType')}
                                    </span>
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {formData.taskType === 'EPIC' && <Zap className={`h-4 w-4 ${getTaskTypeColor('EPIC')}`} />}
                                    {formData.taskType === 'TASK' && <CheckSquare className={`h-4 w-4 ${getTaskTypeColor('TASK')}`} />}
                                    {formData.taskType === 'STORY' && <BookOpen className={`h-4 w-4 ${getTaskTypeColor('STORY')}`} />}
                                    {formData.taskType === 'BUG' && <Bug className={`h-4 w-4 ${getTaskTypeColor('BUG')}`} />}
                                </div>
                                {showTaskTypeDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
                                        {taskTypeOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, taskType: option.value });
                                                        setShowTaskTypeDropdown(false);
                                                    }}
                                                    className={`w-full px-3 py-2 pl-9 text-left hover:bg-accent flex items-center gap-2 relative ${formData.taskType === option.value ? 'bg-accent' : ''
                                                        }`}
                                                >
                                                    <Icon className={`h-4 w-4 ${option.color} absolute left-2.5`} />
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <GitBranch className="w-4 h-4" />
                                {t('projects.detail.tasks.form.parentTask')}
                            </label>
                            <Select
                                value={formData.parentTaskId}
                                onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                                className="w-full"
                            >
                                <option value=""> </option>
                                {tasksData
                                    .filter(t => !editingTask || t.id !== editingTask.id)
                                    .map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <Milestone className="w-4 h-4" />
                                {t('projects.detail.tasks.form.phase')}
                            </label>
                            <PhaseSelect
                                phases={phases}
                                value={formData.phaseId}
                                onChange={(value) => setFormData({ ...formData, phaseId: value })}
                                placeholder=" "
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                {t('projects.detail.tasks.form.assignee')}
                            </label>
                            <UserSelect
                                assignableUsers={assignableUsers}
                                value={formData.assignee}
                                onChange={(id) => setFormData({ ...formData, assignee: id })}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {t('projects.detail.tasks.form.status')}
                            </label>
                            <Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full"
                            >
                                <option value="Đang chờ">{t('dashboard.status.pending')}</option>
                                <option value="Đang thực hiện">{t('dashboard.status.inProgress')}</option>
                                <option value="Hoàn thành">{t('dashboard.status.completed')}</option>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <Flag className="w-4 h-4" />
                                {t('projects.detail.tasks.form.priority')}
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                    className="w-full px-3 py-2 pl-9 text-left border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        {priorityOptions.find(opt => opt.value === formData.priority)?.label || t('projects.detail.tasks.form.priority')}
                                    </span>
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {formData.priority === 'Cao' && <ChevronUp className="h-4 w-4 text-red-600 dark:text-red-400" />}
                                    {formData.priority === 'Trung bình' && <Equal className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                                    {formData.priority === 'Thấp' && <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                </div>
                                {showPriorityDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-lg">
                                        {priorityOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, priority: option.value });
                                                        setShowPriorityDropdown(false);
                                                    }}
                                                    className={`w-full px-3 py-2 pl-9 text-left hover:bg-accent flex items-center gap-2 relative ${formData.priority === option.value ? 'bg-accent' : ''
                                                        }`}
                                                >
                                                    <Icon className={`h-4 w-4 ${option.color} absolute left-2.5`} />
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {t('projects.detail.tasks.form.startDate')}
                            </label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                                <CalendarClock className="w-4 h-4" />
                                {t('projects.detail.tasks.form.dueDate')}
                            </label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            <TaskDetailModal
                open={showDetail}
                onClose={() => { setShowDetail(false); setDetailTask(null); }}
                task={detailTask}
                onEdit={(task) => {
                    setShowDetail(false);
                    handleEditTask(task);
                }}
                onDelete={handleDeleteTask}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                open={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setTaskToDelete(null); }}
                title={t('projects.detail.tasks.actions.deleteTask')}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setTaskToDelete(null); }}>
                            {t('ui.common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteTask}>
                            {t('ui.common.delete')}
                        </Button>
                    </div>
                }
            >
                <p className="text-foreground">
                    {t('projects.detail.tasks.messages.deleteConfirm', { name: taskToDelete?.title || '' })}
                </p>
            </Modal>


        </>

    );

}


