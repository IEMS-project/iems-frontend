import { request } from "../lib/api";

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
};


