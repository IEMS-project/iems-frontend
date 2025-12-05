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
import { CheckSquare, Bug, BookOpen, Zap, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Equal } from 'lucide-react';
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
        setShowModal(true);
    };

    const handleAddTask = () => {
        setEditingTask(null);
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
                await taskService.updateTask(editingTask.id, payload);
                toast.success(t('projects.detail.tasks.messages.updated'));
            } else {
                await taskService.createTask(payload);
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
                toast.error(e?.message || "Có lỗi xảy ra khi lưu nhiệm vụ");
            }
        } finally {
            setLoading(false);
        }
    };

    const showLoading = loading || tasksLoading;

    const handleClose = () => {
        setShowModal(false);
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
                    {/* Left side - Description */}
                    <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2 pl-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.title')}</label>
                            <Input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full"
                                placeholder={t('projects.detail.tasks.form.titlePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.description')}</label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(content) => setFormData({ ...formData, description: content })}
                                placeholder={t('projects.detail.tasks.form.descriptionPlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Right side - Details */}
                    <div className="lg:col-span-1 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4 pr-2 pl-2">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('tasks.detail.fields.details')}</div>

                        {editingTask && (
                            <div>
                                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">{t('tasks.detail.fields.project')}</div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                    {(editingTask.project && editingTask.project.name) || editingTask.projectName || '-'}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.taskType')}</label>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.parentTask')}</label>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.phase')}</label>
                            <PhaseSelect
                                phases={phases}
                                value={formData.phaseId}
                                onChange={(value) => setFormData({ ...formData, phaseId: value })}
                                placeholder="Không thuộc giai đoạn nào"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.assignee')}</label>
                            <UserSelect
                                assignableUsers={assignableUsers}
                                value={formData.assignee}
                                onChange={(id) => setFormData({ ...formData, assignee: id })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.status')}</label>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.priority')}</label>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.startDate')}</label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projects.detail.tasks.form.dueDate')}</label>
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
            />





        </>

    );

}


