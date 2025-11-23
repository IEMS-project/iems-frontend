import { request, baseRequest } from "../lib/api";

export const projectService = {
  async getMyProjects() {
    const data = await baseRequest("/project-service/projects/my-projects");
    return data?.data || data || [];
  },

  async getProjectsTable() {
    const data = await request("/project-service/projects/table");
    return data?.data || data || [];
  },

  async createProject(projectData) {
    const data = await request("/project-service/projects", {
      method: "POST",
      body: projectData,
    });
    return data?.data || data;
  },

  async getProjectById(projectId) {
    const data = await request(`/project-service/projects/${projectId}`);
    return data?.data || data || null;
  },

  async updateProject(projectId, projectData) {
    const data = await request(`/project-service/projects/${projectId}`, {
      method: "PATCH",
      body: projectData,
    });
    return data?.data || data;
  },

  async deleteProject(projectId) {
    const data = await request(`/project-service/projects/${projectId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async getProjectMembers(projectId) {
    const data = await request(`/project-service/api/projects/${projectId}/members`);
    return data?.data || data || [];
  },

  async addProjectMember(projectId, memberData) {
    const data = await request(`/project-service/api/projects/${projectId}/members`, {
      method: "POST",
      body: memberData,
    });
    return data?.data || data;
  },

  async getProjectRoles(projectId) {
    const data = await request(`/project-service/api/projects/${projectId}/roles`);
    return data?.data || data || [];
  },

  async addProjectRole(projectId, payload) {
    const data = await request(`/project-service/api/projects/${projectId}/roles`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteProjectRole(projectId, roleId) {
    const data = await request(`/project-service/api/projects/${projectId}/roles/${roleId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },
};

