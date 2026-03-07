import { request } from "../lib/api";

export const userService = {
  async getAllUsers() {
    const data = await request("/iam-service/users");
    return data?.data || data || [];
  },

  async getMyProfile() {
    const data = await request("/iam-service/users/me");
    return data?.data || data || null;
  },

  async updateMyProfile(payload) {
    const data = await request("/iam-service/users/me", {
      method: "PUT",
      body: payload,
    });
    return data?.data || data || null;
  },

  async updateMyAvatar(imageUrl) {
    const data = await request("/iam-service/users/me/avatar", {
      method: "PUT",
      body: { imageUrl },
    });
    return data?.data || data || null;
  },

  async getAllUserBasicInfos() {
    const data = await request("/iam-service/users/basic-infos");
    return data?.data || data || [];
  },

  async getProjectManagerCandidates() {
    const data = await request("/iam-service/users/project-manager-candidates");
    return data?.data || data || [];
  },

  async getAssignableUsers() {
    const list = await this.getAllUserBasicInfos();
    return (list || []).map((u) => ({
      id: u.id || u.userId,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      image: u.image || "",
      role: u.role || (Array.isArray(u.roleCodes) ? u.roleCodes[0] : undefined),
    }));
  },

  async getUsersForSharing() {
    return this.getAllUserBasicInfos();
  },

  async getRoles() {
    const data = await request("/iam-service/api/roles");
    return data?.data || data || [];
  },

  async getUserById(userId) {
    const data = await request(`/iam-service/users/${userId}`);
    return data?.data || data || null;
  },

  async getUsersByIds(userIds) {
    const promises = userIds.map((id) => this.getUserById(id));
    const results = await Promise.allSettled(promises);
    return results
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value);
  },

  async createUser(payload) {
    const data = await request("/iam-service/users", {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  async updateUser(userId, payload) {
    const data = await request(`/iam-service/users/${userId}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async deleteUser(userId) {
    const data = await request(`/iam-service/users/${userId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("file", file);

    const data = await request("/document-service/api/documents/upload/avatar", {
      method: "POST",
      body: formData,
    });
    return data?.data || data;
  },
};
