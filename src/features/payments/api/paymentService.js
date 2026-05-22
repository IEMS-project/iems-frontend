import { request } from "@/lib/api";

export const paymentService = {
  async getActiveSubscriptionPlans() {
    const data = await request("/iam-service/api/subscription-plans/active");
    return data?.data || data || [];
  },

  async createPayOSPayment(payload) {
    const data = await request("/iam-service/api/payments/payos/create", {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async getPayOSPaymentStatus(orderCode) {
    const data = await request(`/iam-service/api/payments/payos/status/${orderCode}`);
    return data?.data || data;
  },

  async cancelPayOSPayment(orderCode) {
    const data = await request(`/iam-service/api/payments/payos/cancel/${orderCode}`, {
      method: "POST",
    });
    return data?.data || data;
  },
};
