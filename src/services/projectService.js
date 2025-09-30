import { api } from "../lib/api";

export const projectService = {
  async getProjectsTable() {
    return api.getProjectsTable();
  },
  async createProject(projectData) {
    return api.createProject(projectData);
  },
  async getProjectById(projectId) {
    return api.getProjectById(projectId);
  },
  async getProjectMembers(projectId) {
    return api.getProjectMembers(projectId);
  },
  async updateProject(projectId, projectData) {
    return api.updateProject(projectId, projectData);
  },
  async deleteProject(projectId) {
    return api.deleteProject(projectId);
  },
};

