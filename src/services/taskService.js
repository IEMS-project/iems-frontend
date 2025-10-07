import { api } from "../lib/api";

export const taskService = {
  async getTasksByProject(projectId) {
    return api.getTasksByProject(projectId);
  },
  async getMyTasks() {
    return api.getMyTasks();
  },
  async createTask(payload) {
    return api.createTask(payload);
  },
  async updateTask(taskId, payload) {
    return api.updateTask(taskId, payload);
  },
  async bulkUpdateStatus(taskIds, newStatus) {
    return api.bulkUpdateTaskStatus(taskIds, newStatus);
  },
  async getComments(taskId) {
    return api.getTaskComments(taskId);
  },
  async addComment(taskId, content) {
    return api.addTaskComment(taskId, content);
  },
};

















