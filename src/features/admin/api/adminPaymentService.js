import { request } from "@/lib/api";

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const adminPaymentService = {
  async getPayments(params) {
    const data = await request(`/iam-service/api/admin/payments${toQuery(params)}`);
    return data?.data || data;
  },

  async syncPayment(orderCode) {
    const data = await request(`/iam-service/api/admin/payments/${orderCode}/sync`, {
      method: "POST",
    });
    return data?.data || data;
  },

  async cancelPayment(orderCode) {
    const data = await request(`/iam-service/api/admin/payments/${orderCode}/cancel`, {
      method: "POST",
    });
    return data?.data || data;
  },
};
