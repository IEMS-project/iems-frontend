import { request, baseRequest } from "@/lib/api";

const BASE = "/project-service/projects";

export const projectService = {
  // ── Project CRUD ─────────────────────────────────────────────
  async getMyProjects() {
    const data = await baseRequest(`${BASE}/my-projects`);
    const payload = data?.data || data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    return [];
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

  async addProjectMembersBatch(projectId, members) {
    const data = await request(`${BASE}/${projectId}/members/batch`, {
      method: "POST",
      body: { members },
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

  async updateMemberStatus(projectId, userId, status) {
    const data = await request(`${BASE}/${projectId}/members/${userId}/status`, {
      method: "PATCH",
      body: { status },
    });
    return data?.data || data;
  },

  // ── Member Permissions ────────────────────────────────────────
  async getMemberPermissions(projectId, userId) {
    const data = await request(`${BASE}/${projectId}/members/${userId}/permissions`);
    return data?.data || data || { granted: [], denied: [] };
  },

  async grantMemberPermission(projectId, userId, permCode) {
    const data = await request(
      `${BASE}/${projectId}/members/${userId}/permissions/${permCode}/grant`,
      { method: "POST" }
    );
    return data?.data || data;
  },

  async denyMemberPermission(projectId, userId, permCode) {
    const data = await request(
      `${BASE}/${projectId}/members/${userId}/permissions/${permCode}/deny`,
      { method: "POST" }
    );
    return data?.data || data;
  },

  async resetMemberPermission(projectId, userId, permCode) {
    const data = await request(
      `${BASE}/${projectId}/members/${userId}/permissions/${permCode}`,
      { method: "DELETE" }
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

  async assignPermission(projectId, roleId, permCode) {
    const data = await request(
      `${BASE}/${projectId}/roles/${roleId}/permissions/${permCode}`,
      { method: "POST" }
    );
    return data?.data || data;
  },

  async removePermission(projectId, roleId, permCode) {
    const data = await request(
      `${BASE}/${projectId}/roles/${roleId}/permissions/${permCode}`,
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

  async syncIssueTypes(projectId, issueTypes) {
    const data = await request(`${BASE}/${projectId}/issue-types/sync`, {
      method: "POST",
      body: { issueTypes },
    });
    return data?.data || data || [];
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

  async syncIssuePriorities(projectId, priorities) {
    const data = await request(`${BASE}/${projectId}/issue-priorities/sync`, {
      method: "POST",
      body: { priorities },
    });
    return data?.data || data || [];
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
  async getActivities(projectId, page = 0, size = 10) {
    const data = await request(`${BASE}/${projectId}/activities?page=${page}&size=${size}`);
    return data?.data || { content: [], page: 0, totalPages: 1, totalElements: 0 };
  },

  async getIssueActivities(projectId, issueId) {
    const data = await request(`${BASE}/${projectId}/activities/issues/${issueId}`);
    return data?.data || data || [];
  },
};
