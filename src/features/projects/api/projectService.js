import { request, baseRequest } from "@/lib/api";

const BASE = "/project-service/projects";

export const projectService = {
  // ── Project CRUD ─────────────────────────────────────────────
  async getMyProjects() {
    const data = await baseRequest(`${BASE}/my-projects`);
    return data?.data || data || [];
  },

  async getAllProjects() {
    const data = await request(`${BASE}/all`);
    return data?.data || data || [];
  },

  async getProjectsTable() {
    const data = await request(`${BASE}/table`);
    return data?.data || data || [];
  },

  async createProject(projectData) {
    const data = await request(BASE, {
      method: "POST",
      body: projectData,
    });
    return data?.data || data;
  },

  async getProjectById(projectId) {
    const data = await request(`${BASE}/${projectId}`);
    return data?.data || data || null;
  },

  async updateProject(projectId, projectData) {
    const data = await request(`${BASE}/${projectId}`, {
      method: "PATCH",
      body: projectData,
    });
    return data?.data || data;
  },

  async deleteProject(projectId) {
    const data = await request(`${BASE}/${projectId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async getProjectsByIds(ids) {
    const data = await request(`${BASE}/by-ids`, {
      method: "POST",
      body: { ids },
    });
    return data?.data || data || [];
  },

  // ── Members ──────────────────────────────────────────────────
  async getProjectMembers(projectId) {
    const data = await request(`${BASE}/${projectId}/members`);
    return data?.data || data || [];
  },

  async addProjectMember(projectId, memberData) {
    const data = await request(`${BASE}/${projectId}/members`, {
      method: "POST",
      body: memberData,
    });
    return data?.data || data;
  },

  async removeProjectMember(projectId, accountId) {
    const data = await request(`${BASE}/${projectId}/members/${accountId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async updateMemberRole(projectId, accountId, roleId) {
    const data = await request(
      `${BASE}/${projectId}/members/${accountId}/role?roleId=${encodeURIComponent(roleId)}`,
      { method: "PATCH" }
    );
    return data?.data || data;
  },

  // ── Roles ────────────────────────────────────────────────────
  async getProjectRoles(projectId) {
    const data = await request(`${BASE}/${projectId}/roles`);
    return data?.data || data || [];
  },

  async addProjectRole(projectId, payload) {
    const data = await request(`${BASE}/${projectId}/roles`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateProjectRole(projectId, roleId, payload) {
    const data = await request(`${BASE}/${projectId}/roles/${roleId}`, {
      method: "PATCH",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteProjectRole(projectId, roleId) {
    const data = await request(`${BASE}/${projectId}/roles/${roleId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // ── Permissions ──────────────────────────────────────────────
  async getAllPermissions(projectId) {
    const data = await request(`${BASE}/${projectId}/roles/permissions/all`);
    return data?.data || data || [];
  },

  async createPermission(projectId, payload) {
    const data = await request(`${BASE}/${projectId}/roles/permissions`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async getRolePermissions(projectId, roleId) {
    const data = await request(`${BASE}/${projectId}/roles/${roleId}/permissions`);
    return data?.data || data || [];
  },

  async assignPermission(projectId, roleId, permissionId) {
    const data = await request(
      `${BASE}/${projectId}/roles/${roleId}/permissions/${permissionId}`,
      { method: "POST" }
    );
    return data?.data || data;
  },

  async removePermission(projectId, roleId, permissionId) {
    const data = await request(
      `${BASE}/${projectId}/roles/${roleId}/permissions/${permissionId}`,
      { method: "DELETE" }
    );
    return data?.data || data;
  },

  // ── Issue Types ──────────────────────────────────────────────
  async getIssueTypes(projectId) {
    const data = await request(`${BASE}/${projectId}/issue-types`);
    return data?.data || data || [];
  },

  async createIssueType(projectId, payload) {
    const data = await request(`${BASE}/${projectId}/issue-types`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateIssueType(projectId, id, payload) {
    const data = await request(`${BASE}/${projectId}/issue-types/${id}`, {
      method: "PATCH",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteIssueType(projectId, id) {
    const data = await request(`${BASE}/${projectId}/issue-types/${id}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // ── Issue Priorities ─────────────────────────────────────────
  async getIssuePriorities(projectId) {
    const data = await request(`${BASE}/${projectId}/issue-priorities`);
    return data?.data || data || [];
  },

  async createIssuePriority(projectId, payload) {
    const data = await request(`${BASE}/${projectId}/issue-priorities`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateIssuePriority(projectId, id, payload) {
    const data = await request(`${BASE}/${projectId}/issue-priorities/${id}`, {
      method: "PATCH",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteIssuePriority(projectId, id) {
    const data = await request(`${BASE}/${projectId}/issue-priorities/${id}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // ── Activity Log ─────────────────────────────────────────────
  async getActivities(projectId) {
    const data = await request(`${BASE}/${projectId}/activities`);
    return data?.data || data || [];
  },

  async getIssueActivities(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/activities/issues/${issueId}`);
    return data?.data || data || [];
  },
};
