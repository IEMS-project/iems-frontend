import { request } from "@/lib/api";

export const adminSubscriptionService = {
  async getPlans() {
    const data = await request("/iam-service/api/admin/subscription-plans");
    return data?.data || data || [];
  },

  async createPlan(payload) {
    const data = await request("/iam-service/api/admin/subscription-plans", {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updatePlan(id, payload) {
    const data = await request(`/iam-service/api/admin/subscription-plans/${id}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async setPlanActive(id, active) {
    const data = await request(`/iam-service/api/admin/subscription-plans/${id}/active`, {
      method: "PATCH",
      body: { active },
    });
    return data?.data || data;
  },

  async deletePlan(id) {
    const data = await request(`/iam-service/api/admin/subscription-plans/${id}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },
};
