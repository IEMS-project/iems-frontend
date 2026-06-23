import { request } from "@/lib/api";

export const labelService = {
  async getLabelsByProject(projectId) {
    const data = await request(`/project-service/labels/project/${projectId}`);
    return data?.data || data || [];
  },

  async createLabel(payload) {
    const data = await request("/project-service/labels", {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateLabel(labelId, payload) {
    const data = await request(`/project-service/labels/${labelId}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteLabel(labelId) {
    await request(`/project-service/labels/${labelId}`, {
      method: "DELETE",
    });
  },
};
