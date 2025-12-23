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

  async updateMemberStatus(projectId, userId, status) {
    const data = await request(`/project-service/api/projects/${projectId}/members/${userId}/status?status=${status}`, {
      method: "PUT",
    });
    return data?.data || data;
  },

  // Phase APIs
  async getPhases(projectId) {
    const data = await request(`/project-service/projects/${projectId}/phases`);
    return data?.data || data || [];
  },

  async getPhaseById(projectId, phaseId) {
    const data = await request(`/project-service/projects/${projectId}/phases/${phaseId}`);
    return data?.data || data || null;
  },

  async createPhase(projectId, phaseData) {
    const data = await request(`/project-service/projects/${projectId}/phases`, {
      method: "POST",
      body: phaseData,
    });
    return data?.data || data;
  },

  async updatePhase(projectId, phaseId, phaseData) {
    const data = await request(`/project-service/projects/${projectId}/phases/${phaseId}`, {
      method: "PATCH",
      body: phaseData,
    });
    return data?.data || data;
  },

  async deletePhase(projectId, phaseId) {
    const data = await request(`/project-service/projects/${projectId}/phases/${phaseId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },
};

