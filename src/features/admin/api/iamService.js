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

  async getRolePermissions(id) {
    const data = await request(`/iam-service/api/roles/${id}/permissions`);
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

  async assignPermissions(roleId, permissionCodes) {
    const data = await request(`/iam-service/api/roles/${roleId}/permissions`, {
      method: "POST",
      body: { permissionCodes },
    });
    return data?.data || data;
  },

  async getPermissions() {
    const data = await request("/iam-service/api/permissions");
    return data?.data || data || [];
  },

  async createPermission(payload) {
    const data = await request("/iam-service/api/permissions", {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updatePermission(id, payload) {
    const data = await request(`/iam-service/api/permissions/${id}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async deletePermission(id) {
    const data = await request(`/iam-service/api/permissions/${id}`, {
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

  async getUserPermissions(userId) {
    const data = await request(`/iam-service/api/accounts/${userId}/permissions`);
    return data?.data || null;
  },

  async resetAccountPassword(userId, newPassword) {
    const data = await request(`/iam-service/api/accounts/${userId}/password`, {
      method: "PUT",
      body: { newPassword },
    });
    return data?.data || data;
  },
};


