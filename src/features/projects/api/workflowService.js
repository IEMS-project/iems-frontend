import { request } from "@/lib/api";

const BASE = "/project-service/projects";

export const workflowService = {
  // ── Workflows ────────────────────────────────────────────────
  async getWorkflows(projectId) {
    const data = await request(`${BASE}/${projectId}/workflows`);
    return data?.data || data || [];
  },

  async createWorkflow(projectId, payload) {
    const data = await request(`${BASE}/${projectId}/workflows`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async getWorkflowById(projectId, workflowId) {
    const data = await request(`${BASE}/${projectId}/workflows/${workflowId}`);
    return data?.data || data || null;
  },

  async updateWorkflow(projectId, workflowId, payload) {
    const data = await request(`${BASE}/${projectId}/workflows/${workflowId}`, {
      method: "PATCH",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteWorkflow(projectId, workflowId) {
    const data = await request(`${BASE}/${projectId}/workflows/${workflowId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // ── Workflow Statuses (Board Columns) ────────────────────────
  async getStatuses(projectId, workflowId) {
    const data = await request(`${BASE}/${projectId}/workflows/${workflowId}/statuses`);
    return data?.data || data || [];
  },

  async createStatus(projectId, workflowId, payload) {
    const data = await request(`${BASE}/${projectId}/workflows/${workflowId}/statuses`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateStatus(projectId, workflowId, statusId, payload) {
    const data = await request(
      `${BASE}/${projectId}/workflows/${workflowId}/statuses/${statusId}`,
      { method: "PATCH", body: payload }
    );
    return data?.data || data;
  },

  async deleteStatus(projectId, workflowId, statusId) {
    const data = await request(
      `${BASE}/${projectId}/workflows/${workflowId}/statuses/${statusId}`,
      { method: "DELETE" }
    );
    return data?.data || data;
  },

  async syncStatuses(projectId, workflowId, statuses) {
    const data = await request(
      `${BASE}/${projectId}/workflows/${workflowId}/statuses/sync`,
      {
        method: "POST",
        body: { statuses },
      }
    );
    return data?.data || data || [];
  },

  // ── Workflow Transitions ─────────────────────────────────────
  async getTransitions(projectId, workflowId) {
    const data = await request(`${BASE}/${projectId}/workflows/${workflowId}/transitions`);
    return data?.data || data || [];
  },

  async createTransition(projectId, workflowId, payload) {
    const data = await request(`${BASE}/${projectId}/workflows/${workflowId}/transitions`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteTransition(projectId, workflowId, transitionId) {
    const data = await request(
      `${BASE}/${projectId}/workflows/${workflowId}/transitions/${transitionId}`,
      { method: "DELETE" }
    );
    return data?.data || data;
  },
};
