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
  async getProjectRoles(projectId) {
    return api.getProjectRoles(projectId);
  },
  async addProjectRole(projectId, payload) {
    return api.addProjectRole(projectId, payload);
  },
  async deleteProjectRole(projectId, roleId) {
    return api.deleteProjectRole(projectId, roleId);
  },
  async updateProject(projectId, projectData) {
    return api.updateProject(projectId, projectData);
  },
  async deleteProject(projectId) {
    return api.deleteProject(projectId);
  },
  async addProjectMember(projectId, memberData) {
    return api.addProjectMember(projectId, memberData);
  },
};

