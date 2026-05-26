import { request } from "@/lib/api";

// Available roles from UserRole enum in backend
export const AVAILABLE_ROLES = ["ADMIN", "USER"];

export const iamService = {
  // Note: Role management endpoints removed - now using UserRole enum
  // Available roles: ADMIN, USER

  // Accounts & user access
  async getAccounts() {
    const data = await request("/iam-service/api/accounts");
    return data?.data || data || [];
  },

  async getAdminAccounts({ page = 0, size = 20, q = "" } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (q) params.set("q", q);

    const data = await request(`/iam-service/api/accounts/_admin?${params.toString()}`);
    const pageData = data?.data || data || {};
    return {
      items: Array.isArray(pageData.content) ? pageData.content : [],
      page: Number.isInteger(pageData.number) ? pageData.number : page,
      size: Number.isInteger(pageData.size) ? pageData.size : size,
      totalPages: Number.isInteger(pageData.totalPages) ? pageData.totalPages : 0,
      totalElements: Number.isInteger(pageData.totalElements) ? pageData.totalElements : 0,
      hasPrevious: pageData.first === false,
      hasNext: pageData.last === false,
    };
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

  // User profile management
  async getUserByAccountId(accountId) {
    const data = await request(`/iam-service/users/by-account/${accountId}`);
    return data?.data || null;
  },

  async getUsersByAccountIds(accountIds) {
    const data = await request(`/iam-service/users/by-account-ids`, {
      method: "POST",
      body: { accountIds },
    });
    return data?.data || [];
  },

  async getUserById(userId) {
    const data = await request(`/iam-service/users/${userId}`);
    return data?.data || null;
  },

  async updateUser(userId, payload) {
    const data = await request(`/iam-service/users/${userId}`, {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },

  async createUser(payload) {
    const data = await request(`/iam-service/users`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },

  // ── Subscription management (Admin) ─────────────────────────────────────

  /** Admin: upgrade a user to Premium for N days */
  async upgradeAccountToPremium(accountId, durationDays) {
    const data = await request(`/iam-service/api/accounts/${accountId}/upgrade`, {
      method: "POST",
      body: { durationDays },
    });
    return data?.data || data;
  },

  /** Admin: downgrade a user to Free */
  async downgradeAccountToFree(accountId) {
    const data = await request(`/iam-service/api/accounts/${accountId}/downgrade`, {
      method: "POST",
    });
    return data?.data || data;
  },

  /** Current user: get own subscription status */
  async getMySubscription() {
    const data = await request("/iam-service/api/accounts/me/subscription");
    return data?.data || data;
  },
};


