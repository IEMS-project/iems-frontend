import { getStoredTokens, request, requestNoAuth } from "../lib/api";

function requireUserId() {
  const tokens = getStoredTokens();
  const userId = tokens?.userInfo?.userId;
  if (!tokens?.accessToken || !userId) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này");
  }
  return userId;
}

export const departmentService = {
  async getDepartments() {
    const data = await request("/department-service/departments");
    return data?.data || data || [];
  },

  async getDepartmentById(id) {
    const data = await requestNoAuth(`/department-service/departments/${id}`);
    return data?.data || null;
  },

  async getDepartmentWithUsers(id) {
    const data = await request(`/department-service/departments/${id}/users`);
    return data?.data || null;
  },

  async addUsersToDepartment(departmentId, userIds) {
    const payload = Array.isArray(userIds) ? userIds : userIds?.userIds || [];
    const data = await request(`/department-service/departments/${departmentId}/users`, {
      method: "POST",
      body: { userIds: payload },
    });
    return data?.data || data;
  },

  async removeUserFromDepartment(departmentId, userId) {
    const data = await request(`/department-service/departments/${departmentId}/users/${userId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async createDepartment(payload) {
    const userId = requireUserId();
    const data = await request("/department-service/departments", {
      method: "POST",
      headers: { "X-User-Id": userId },
      body: payload,
    });
    return data?.data || data;
  },

  async updateDepartment(id, payload) {
    const userId = requireUserId();
    const data = await request(`/department-service/departments/${id}`, {
      method: "PATCH",
      headers: { "X-User-Id": userId },
      body: payload,
    });
    return data?.data || data;
  },

  async updateDepartmentManager(id, managerId) {
    const data = await request(`/department-service/departments/${id}/manager`, {
      method: "PATCH",
      body: { managerId },
    });
    return data?.data || data;
  },

  async deleteDepartment(id) {
    const userId = requireUserId();
    const data = await request(`/department-service/departments/${id}`, {
      method: "DELETE",
      headers: { "X-User-Id": userId },
    });
    return data?.data || data;
  },
};
