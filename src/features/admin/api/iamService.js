import { request } from "@/lib/api";

export const iamService = {
  async getRoles() {
    const data = await request("/iam-service/api/roles");
    return data?.data || data || [];
  },

  async getRoleById(id) {
    const data = await request(`/iam-service/api/roles/${id}`);
    return data?.data || null;
  },

  async createRole(payload) {
    const data = await request("/iam-service/api/roles", {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateRole(id, payload) {
    const data = await request(`/iam-service/api/roles/${id}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteRole(id) {
    const data = await request(`/iam-service/api/roles/${id}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  // Accounts & user access
  async getAccounts() {
    const data = await request("/iam-service/api/accounts");
    return data?.data || data || [];
  },

  async getAccountById(id) {
    const data = await request(`/iam-service/api/accounts/${id}`);
    return data?.data || null;
  },

  async updateAccount(id, payload) {
    const data = await request(`/iam-service/api/accounts/${id}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async lockAccount(userId, locked, reason) {
    const data = await request(`/iam-service/api/accounts/${userId}/lock`, {
      method: "PUT",
      body: { locked, reason },
    });
    return data?.data || data;
  },

  async updateAccountRoles(userId, roleCodes) {
    const data = await request(`/iam-service/api/accounts/${userId}/roles`, {
      method: "POST",
      body: { roleCodes },
    });
    return data?.data || data;
  },

  async resetAccountPassword(userId, newPassword) {
    const data = await request(`/iam-service/api/accounts/${userId}/password`, {
      method: "PUT",
      body: { newPassword },
    });
    return data?.data || data;
  },
};


