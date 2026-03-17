import { request } from "@/lib/api";

const BASE = "/project-service/projects";

export const sprintService = {
  // ── CRUD ─────────────────────────────────────────────────────
  async getSprints(projectId) {
    const data = await request(`${BASE}/${projectId}/sprints`);
    return data?.data || data || [];
  },

  async createSprint(projectId, payload) {
    const data = await request(`${BASE}/${projectId}/sprints`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async getSprintById(projectId, sprintId) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}`);
    return data?.data || data || null;
  },

  async updateSprint(projectId, sprintId, payload) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}`, {
      method: "PATCH",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteSprint(projectId, sprintId) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // ── Lifecycle ────────────────────────────────────────────────
  async startSprint(projectId, sprintId) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}/start`, {
      method: "POST",
    });
    return data?.data || data;
  },

  async completeSprint(projectId, sprintId) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}/complete`, {
      method: "POST",
    });
    return data?.data || data;
  },

  async cancelSprint(projectId, sprintId) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}/cancel`, {
      method: "POST",
    });
    return data?.data || data;
  },

  // ── Sprint Issues ────────────────────────────────────────────
  async getSprintIssues(projectId, sprintId) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}/issues`);
    return data?.data || data || [];
  },

  async getBurndown(projectId, sprintId) {
    const data = await request(`${BASE}/${projectId}/sprints/${sprintId}/burndown`);
    return data?.data || data || null;
  },
};
