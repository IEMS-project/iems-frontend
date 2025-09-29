// Simple API client for calling backend through API Gateway
const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8080";

function getStoredTokens() {
  try {
    const raw = localStorage.getItem("iems.auth");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

function setStoredTokens(payload) {
  if (!payload) {
    localStorage.removeItem("iems.auth");
    return;
  }
  localStorage.setItem("iems.auth", JSON.stringify(payload));
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const tokens = getStoredTokens();
  const finalHeaders = { "Content-Type": "application/json", ...headers };
  if (tokens?.accessToken) {
    finalHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(`${GATEWAY_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || data?.error || res.statusText;
    const error = new Error(message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function requestNoAuth(path, { method = "GET", headers = {}, body } = {}) {
  const finalHeaders = { "Content-Type": "application/json", ...headers };
  const res = await fetch(`${GATEWAY_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || data?.error || res.statusText;
    const error = new Error(message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  async login(usernameOrEmail, password) {
    const data = await request("/iam-service/api/auth/login", {
      method: "POST",
      body: { usernameOrEmail, password },
    });
    const payload = data?.data || data;
    setStoredTokens(payload);
    return payload;
  },
  logout() {
    setStoredTokens(null);
  },
  async getDepartments() {
    // Public endpoint -> call without Authorization header to avoid gateway/security side-effects
    const data = await requestNoAuth("/department-service/departments");
    return data?.data || [];
  },
  async getDepartmentById(departmentId) {
    // Public endpoint -> call without Authorization header to avoid gateway/security side-effects
    const data = await requestNoAuth(`/department-service/departments/${departmentId}`);
    return data?.data || null;
  },
  async createDepartment({ departmentName, description, managerId }) {
    const tokens = getStoredTokens();
    const userId = tokens?.userInfo?.userId;
    if (!tokens?.accessToken || !userId) {
      throw new Error("Bạn cần đăng nhập để tạo phòng ban");
    }
    const data = await request("/department-service/departments", {
      method: "POST",
      headers: { "X-User-Id": userId },
      body: { departmentName, description, managerId },
    });
    return data?.data || null;
  },
  async updateDepartment(id, { departmentName, description, managerId }) {
    const tokens = getStoredTokens();
    const userId = tokens?.userInfo?.userId;
    if (!tokens?.accessToken || !userId) {
      throw new Error("Bạn cần đăng nhập để cập nhật phòng ban");
    }
    const data = await request(`/department-service/departments/${id}`, {
      method: "PATCH",
      headers: { "X-User-Id": userId },
      body: { departmentName, description, managerId },
    });
    return data?.data || null;
  },
  async deleteDepartment(id) {
    const tokens = getStoredTokens();
    const userId = tokens?.userInfo?.userId;
    if (!tokens?.accessToken || !userId) {
      throw new Error("Bạn cần đăng nhập để xóa phòng ban");
    }
    const data = await request(`/department-service/departments/${id}`, {
      method: "DELETE",
      headers: { "X-User-Id": userId },
    });
    return data?.data || true;
  },
  // User Service APIs
  async getAllUsers() {
    const data = await request("/user-service/users");
    return data?.data || [];
  },
  async getAllUserBasicInfos() {
    // Your gateway to user-service basic infos (secured)
    const data = await request("/user-service/users/basic-infos");
    return data?.data || [];
  },
  async getUserById(userId) {
    const data = await request(`/user-service/users/${userId}`);
    return data?.data || null;
  },
  async getUsersByIds(userIds) {
    // Fetch multiple users by IDs
    const promises = userIds.map(id => this.getUserById(id));
    const results = await Promise.allSettled(promises);
    return results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
  },
  async getDepartmentWithUsers(id) {
    // Requires Authorization so that Department Service can forward the token to User Service
    const data = await request(`/department-service/departments/${id}/users`);
    return data?.data || null;
  },
  async createUser(userData) {
    const data = await request("/user-service/users", {
      method: "POST",
      body: userData,
    });
    return data?.data || data;
  },
  async updateUser(userId, userData) {
    const data = await request(`/user-service/users/${userId}`, {
      method: "PUT",
      body: userData,
    });
    return data?.data || data;
  },
  async deleteUser(userId) {
    const data = await request(`/user-service/users/${userId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },
  async removeUserFromDepartment(departmentId, userId) {
    const data = await request(`/department-service/departments/${departmentId}/users/${userId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },
  async addUsersToDepartment(departmentId, { userIds }) {
    const data = await request(`/department-service/departments/${departmentId}/users`, {
      method: "POST",
      body: { userIds },
    });
    return data?.data || data;
  },
};

export { getStoredTokens, setStoredTokens, GATEWAY_BASE_URL };


