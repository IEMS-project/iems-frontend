import { request } from "@/lib/api";

export const promotionService = {
  async getActivePromotions(placement = "SIDEBAR") {
    const data = await request(`/iam-service/api/promotions/active?placement=${encodeURIComponent(placement)}`);
    return data?.data || data || [];
  },
};

export const adminPromotionService = {
  async getPromotions() {
    const data = await request("/iam-service/api/admin/promotions");
    return data?.data || data || [];
  },

  async createPromotion(payload) {
    const data = await request("/iam-service/api/admin/promotions", {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updatePromotion(id, payload) {
    const data = await request(`/iam-service/api/admin/promotions/${id}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async setPromotionActive(id, active) {
    const data = await request(`/iam-service/api/admin/promotions/${id}/active`, {
      method: "PATCH",
      body: { active },
    });
    return data?.data || data;
  },

  async deletePromotion(id) {
    const data = await request(`/iam-service/api/admin/promotions/${id}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async uploadPromotionImage(file) {
    const formData = new FormData();
    formData.append("files", file);

    const data = await request("/document-service/api/files/upload-public", {
      method: "POST",
      body: formData,
    });
    return data?.data || data || [];
  },
};
