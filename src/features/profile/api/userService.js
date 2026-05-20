import { request } from "@/lib/api";

export const userService = {
  async getAllUsers() {
    const data = await request("/iam-service/users");
    return data?.data || data || [];
  },

  async getMyProfile() {
    const data = await request("/iam-service/users/me");
    return data?.data || data || null;
  },

  async getMySubscription() {
    const data = await request("/iam-service/api/accounts/me/subscription");
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

  async searchUserBasicInfos({ query = "", page = 0, size = 20, excludeAccountIds = [] } = {}) {
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("page", String(page));
    params.set("size", String(size));
    (excludeAccountIds || []).forEach((id) => {
      if (id) params.append("excludeAccountIds", String(id));
    });

    if (import.meta.env.DEV) {
      console.debug("[userService] GET /iam-service/users/basic-infos/search", {
        query,
        page,
        size,
        excludeCount: (excludeAccountIds || []).length,
      });
    }

    const data = await request(`/iam-service/users/basic-infos/search?${params.toString()}`);
    const pageData = data?.data || data || {};
    return {
      items: Array.isArray(pageData.content) ? pageData.content : [],
      page: Number.isInteger(pageData.number) ? pageData.number : page,
      size: Number.isInteger(pageData.size) ? pageData.size : size,
      totalPages: Number.isInteger(pageData.totalPages) ? pageData.totalPages : 0,
      totalElements: Number.isInteger(pageData.totalElements) ? pageData.totalElements : 0,
      hasMore: pageData.last === false,
    };
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

  // Note: Roles are now enum-based (ADMIN, USER) - no API endpoint
  async getRoles() {
    return ["ADMIN", "USER"];
  },

  async getUserById(userId) {
    const data = await request(`/iam-service/users/${userId}`);
    return data?.data || data || null;
  },

  async getUserByAccountId(accountId) {
    const data = await request(`/iam-service/users/by-account/${accountId}`);
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

  async getNotificationPreferences() {
    try {
      const data = await request("/iam-service/users/me/notification-preferences");
      return data?.data || { emailAssigned: true, emailMemberAdded: true, emailDueSoon: true, inAppToast: true };
    } catch (_) {
      return { emailAssigned: true, emailMemberAdded: true, emailDueSoon: true, inAppToast: true };
    }
  },

  async updateNotificationPreferences(prefs) {
    const data = await request("/iam-service/users/me/notification-preferences", {
      method: "PATCH",
      body: prefs,
    });
    return data?.data || data;
  },
};
