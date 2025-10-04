import { api } from "../lib/api";

export const taskService = {
  async getTasksByProject(projectId) {
    return api.getTasksByProject(projectId);
  },
};









