import { request } from "@/lib/api";

export const subscriptionLimitService = {
  async getLimits() {
    const data = await request("/project-service/subscription-limits");
    return data?.data || data || [];
  },

  async updateLimits(planType, payload) {
    const data = await request(`/project-service/api/admin/subscription-limits/${planType}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },
};
