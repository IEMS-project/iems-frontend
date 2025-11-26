import { request } from "../lib/api";

const mapPriority = (priority) => {
  if (!priority) return undefined;
  const value = priority.toString().trim().toUpperCase();
  if (["CAO", "HIGH"].includes(value)) return "HIGH";
  if (["TRUNG BÌNH", "TRUNG BINH", "MEDIUM"].includes(value)) return "MEDIUM";
  if (["THẤP", "THAP", "LOW"].includes(value)) return "LOW";
  return value;
};

const mapTaskType = (type) => {
  if (!type) return undefined;
  const value = type.toString().trim().toUpperCase();
  return ["EPIC", "TASK", "STORY", "BUG"].includes(value) ? value : value;
};

const mapStatus = (status) => {
  if (!status) return undefined;
  const value = status.toString().trim().toUpperCase();
  if (["Đang chờ", "CHO", "TO DO", "TO_DO", "TODO"].includes(value)) return "TO_DO";
  if (["Đang thực hiện", "DANG LAM", "IN PROGRESS", "IN_PROGRESS"].includes(value)) return "IN_PROGRESS";
  if (["HOÀN THÀNH", "HOAN THANH", "COMPLETED", "COMPLETE"].includes(value)) return "COMPLETED";
  return value;
};

const toLocalDate = (input) => {
  if (!input) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(input))) return input;
  try {
    const date = new Date(input);
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  } catch (_e) { }
  return undefined;
};

export const taskService = {
  async getTasksByProject(projectId) {
    const data = await request(`/task-service/tasks/project/${projectId}`);
    const payload = data?.data || data || [];
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  async getMyTasks() {
    const data = await request("/task-service/tasks/my-tasks");
    return data?.data || data || [];
  },

  async createTask(payload) {
    const body = {
      projectId: payload.projectId,
      title: payload.title,
      description: payload.description || undefined,
      assignedTo: payload.assignedTo,
      priority: mapPriority(payload.priority),
      taskType: mapTaskType(payload.taskType),
      parentTaskId: payload.parentTaskId,
      phaseId: payload.phaseId,
      startDate: toLocalDate(payload.startDate),
      dueDate: toLocalDate(payload.dueDate),
    };
    const data = await request("/task-service/tasks", {
      method: "POST",
      body,
    });
    return data?.data || data;
  },

  async updateTask(taskId, payload) {
    const body = {
      title: payload.title,
      description: payload.description,
      assignedTo: payload.assignedTo,
      status: mapStatus(payload.status),
      priority: mapPriority(payload.priority),
      taskType: mapTaskType(payload.taskType),
      parentTaskId: payload.parentTaskId,
      phaseId: payload.phaseId,
      startDate: toLocalDate(payload.startDate),
      dueDate: toLocalDate(payload.dueDate),
    };
    const data = await request(`/task-service/tasks/${taskId}`, {
      method: "PATCH",
      body,
    });
    return data?.data || data;
  },

  async assignTask(taskId, newAssigneeId) {
    const data = await request(`/task-service/tasks/${taskId}/assign?newAssigneeId=${encodeURIComponent(newAssigneeId)}`, {
      method: "PATCH",
    });
    return data?.data || data;
  },

  async bulkUpdateStatus(taskIds, newStatus) {
    const data = await request(`/task-service/tasks/status-bulk?newStatus=${encodeURIComponent(newStatus)}`, {
      method: "POST",
      body: { ids: taskIds },
    });
    return data?.data || data || [];
  },

  async updateTaskPriorityAndDates(taskId, { priority, startDate, dueDate }) {
    const data = await request(`/task-service/tasks/${taskId}/priority-date`, {
      method: "PUT",
      body: {
        priority: mapPriority(priority),
        startDate: toLocalDate(startDate),
        dueDate: toLocalDate(dueDate),
      },
    });
    return data?.data || data;
  },

  async getComments(taskId) {
    const data = await request(`/task-service/tasks/${taskId}/comments`);
    return data?.data || data || [];
  },

  async addComment(taskId, content) {
    const data = await request(`/task-service/tasks/${taskId}/comments`, {
      method: "POST",
      body: { content },
    });
    return data?.data || data;
  },
};


























