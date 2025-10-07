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
  async bulkUpdateTaskStatus(taskIds, newStatus) {
    const data = await request(`/task-service/tasks/status-bulk?newStatus=${encodeURIComponent(newStatus)}`, {
      method: "POST",
      body: { ids: taskIds },
    });
    return data?.data || data || [];
  },
  async getTaskComments(taskId) {
    const data = await request(`/task-service/tasks/${taskId}/comments`);
    return data?.data || data || [];
  },
  async addTaskComment(taskId, content) {
    const data = await request(`/task-service/tasks/${taskId}/comments`, {
      method: "POST",
      body: { content },
    });
    return data?.data || data;
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
  async getMyProfile() {
    const data = await request("/user-service/users/me");
    return data?.data || data;
  },
  async getMyProfileInfo() {
    const data = await request("/user-service/users/me/profile");
    return data?.data || data;
  },
  async updateMyProfile(payload) {
    const data = await request("/user-service/users/me", {
      method: "PUT",
      body: payload,
    });
    return data?.data || data;
  },
  async updateMyAvatar(imageUrl) {
    const data = await request("/user-service/users/me/avatar", {
      method: "PUT",
      body: { imageUrl },
    });
    return data?.data || data;
  },
  async getAllUserBasicInfos() {
    // Your gateway to user-service basic infos (secured)
    const data = await request("/user-service/users/basic-infos");
    return data?.data || [];
  },
  // Assignable users for selection in project member modal (basic fields only)
  async getAssignableUsers() {
    const data = await request("/user-service/users/basic-infos");
    // Ensure we only return firstName, lastName, email, image, role, id
    const list = data?.data || data || [];
    return list.map(u => ({
      id: u.id || u.userId,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      image: u.image || "",
      role: u.role || (Array.isArray(u.roleCodes) ? u.roleCodes[0] : undefined)
    }));
  },
  async getUserById(userId) {
    const data = await request(`/user-service/users/${userId}`);
    return data?.data || null;
  },
  async getRoles() {
    const data = await request(`/user-service/roles`);
    return data?.data || [];
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
  // Project Service APIs
  async getProjectsTable() {
    const data = await request("/project-service/projects/table");
    return data?.data || data || [];
  },
  async createProject(projectData) {
    const data = await request("/project-service/projects", {
      method: "POST",
      body: projectData,
    });
    return data?.data || data;
  },
  async getProjectById(projectId) {
    const data = await request(`/project-service/projects/${projectId}`);
    return data?.data || data;
  },
  async updateProject(projectId, projectData) {
    const data = await request(`/project-service/projects/${projectId}`, {
      method: "PATCH",
      body: projectData,
    });
    return data?.data || data;
  },
  async deleteProject(projectId) {
    const data = await request(`/project-service/projects/${projectId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },
  // Project related aggregates
  async getProjectMembers(projectId) {
    // Prefer gateway facade per user's curl; fallback to service path if not available
        const data = await request(`/project-service/api/projects/${projectId}/members`);
        return data?.data || data || [];
  },
  async addProjectMember(projectId, memberData) {
    const data = await request(`/project-service/api/projects/${projectId}/members`, {
      method: "POST",
      body: memberData,
    });
    return data?.data || data;
  },
  // Project Roles CRUD
  async getProjectRoles(projectId) {
    const data = await request(`/project-service/api/projects/${projectId}/roles`);
    return data?.data || data || [];
  },
  async addProjectRole(projectId, payload) {
    const data = await request(`/project-service/api/projects/${projectId}/roles`, {
      method: "POST",
      body: payload,
    });
    return data?.data || data;
  },
  async deleteProjectRole(projectId, roleId) {
    const data = await request(`/project-service/api/projects/${projectId}/roles/${roleId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },
  async getTasksByProject(projectId) {
    // User's curl hits task-service directly at 8084: /tasks/project/{id}
    // Through gateway we expose it under /task-service/tasks/project/{id}
    const data = await request(`/task-service/tasks/project/${projectId}`);
    const payload = data?.data || data || [];
    // Support both old flat shape and new nested shape with count
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  },
  async getMyTasks() {
    const data = await request(`/task-service/tasks/my-tasks`);
    return data?.data || data || [];
  },
  async createTask(payload) {
    // Backend expects LocalDate for startDate/dueDate and enum priority; also requires X-User-Id
    const tokens = getStoredTokens();
    if (!tokens?.accessToken) {
      throw new Error("Bạn cần đăng nhập để tạo nhiệm vụ");
    }
    const mapPriority = (p) => {
      if (!p) return undefined;
      const v = (p || '').toString().trim().toUpperCase();
      if (v === 'CAO' || v === 'HIGH') return 'HIGH';
      if (v === 'TRUNG BÌNH' || v === 'TRUNG BINH' || v === 'MEDIUM') return 'MEDIUM';
      if (v === 'THẤP' || v === 'THAP' || v === 'LOW') return 'LOW';
      return v; // fallback
    };
    const toLocalDate = (d) => {
      if (!d) return undefined;
      try {
        const date = new Date(d);
        if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
      } catch {}
      // if already in YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return d;
      return undefined;
    };
    const body = {
      projectId: payload.projectId,
      title: payload.title,
      description: payload.description || undefined,
      assignedTo: payload.assignedTo,
      priority: mapPriority(payload.priority),
      startDate: toLocalDate(payload.startDate),
      dueDate: toLocalDate(payload.dueDate),
    };
    const data = await request(`/task-service/tasks`, {
      method: "POST",
      body,
    });
    return data?.data || data;
  },
  async updateTask(taskId, payload) {
    // Map priority and dates to backend types
    const mapPriority = (p) => {
      if (!p) return undefined;
      const v = (p || '').toString().trim().toUpperCase();
      if (v === 'CAO' || v === 'HIGH') return 'HIGH';
      if (v === 'TRUNG BÌNH' || v === 'TRUNG BINH' || v === 'MEDIUM') return 'MEDIUM';
      if (v === 'THẤP' || v === 'THAP' || v === 'LOW') return 'LOW';
      return v;
    };
    const mapStatus = (s) => {
      if (!s) return undefined;
      const v = (s || '').toString().trim().toUpperCase();
      if (v === 'CHỜ' || v === 'CHO' || v === 'TO DO' || v === 'TO_DO' || v === 'TODO') return 'TO_DO';
      if (v === 'ĐANG LÀM' || v === 'DANG LAM' || v === 'IN PROGRESS' || v === 'IN_PROGRESS') return 'IN_PROGRESS';
      if (v === 'HOÀN THÀNH' || v === 'HOAN THANH' || v === 'COMPLETED' || v === 'COMPLETE') return 'COMPLETED';
      return v; // if already enum
    };
    const toLocalDate = (d) => {
      if (!d) return undefined;
      try {
        const date = new Date(d);
        if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
      } catch {}
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return d;
      return undefined;
    };
    const body = {
      title: payload.title,
      description: payload.description,
      assignedTo: payload.assignedTo,
      status: mapStatus(payload.status),
      priority: mapPriority(payload.priority),
      startDate: toLocalDate(payload.startDate),
      dueDate: toLocalDate(payload.dueDate),
    };
    const data = await request(`/task-service/tasks/${taskId}`, {
      method: "PATCH",
      body,
    });
    return data?.data || data;
  },
  async assignTask(taskId, newAssigneeId) {
    const data = await request(`/task-service/tasks/${taskId}/assign?newAssigneeId=${newAssigneeId}`, {
      method: "PATCH",
    });
    return data?.data || data;
  },
  async updateTaskPriorityAndDates(taskId, { priority, startDate, dueDate }) {
    const mapPriority = (p) => {
      if (!p) return undefined;
      const v = (p || '').toString().trim().toUpperCase();
      if (v === 'CAO' || v === 'HIGH') return 'HIGH';
      if (v === 'TRUNG BÌNH' || v === 'TRUNG BINH' || v === 'MEDIUM') return 'MEDIUM';
      if (v === 'THẤP' || v === 'THAP' || v === 'LOW') return 'LOW';
      return v;
    };
    const toLocalDate = (d) => {
      if (!d) return undefined;
      try {
        const date = new Date(d);
        if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
      } catch {}
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return d;
      return undefined;
    };
    const body = {
      priority: mapPriority(priority),
      startDate: toLocalDate(startDate),
      dueDate: toLocalDate(dueDate),
    };
    const data = await request(`/task-service/tasks/${taskId}/priority-date`, {
      method: "PUT",
      body,
    });
    return data?.data || data;
  },
  // Document Service APIs
  async getFolderContents(folderId) {
    const data = await request(`/document-service/api/folders/${folderId}/contents`);
    return data?.data || data;
  },
  async getAllFolders() {
    const data = await request("/document-service/api/folders");
    return data?.data || data || [];
  },
  async getAllFiles() {
    const data = await request("/document-service/api/files");
    return data?.data || data || [];
  },
  async createFolder(name, parentId = null) {
    const data = await request("/document-service/api/folders", {
      method: "POST",
      body: { name, parentId }
    });
    return data?.data || data;
  },
  async uploadFile(folderId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const tokens = getStoredTokens();
    const finalHeaders = {};
    if (tokens?.accessToken) {
      finalHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
    }
    
    const res = await fetch(`${GATEWAY_BASE_URL}/document-service/api/files/upload?folderId=${folderId || ''}`, {
      method: 'POST',
      headers: finalHeaders,
      body: formData
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const message = errorData?.message || errorData?.error || res.statusText;
      const error = new Error(message || "Upload failed");
      error.status = res.status;
      error.data = errorData;
      throw error;
    }
    
    return await res.json();
  },
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);

    const tokens = getStoredTokens();
    const finalHeaders = {};
    if (tokens?.accessToken) {
      finalHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
    }

    const res = await fetch(`${GATEWAY_BASE_URL}/document-service/api/documents/upload/avatar`, {
      method: 'POST',
      headers: finalHeaders,
      body: formData
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.message || data?.error || res.statusText;
      const error = new Error(message || "Upload failed");
      error.status = res.status;
      error.data = data;
      throw error;
    }
    // data may be {code,message,data:url}
    return data?.data || data;
  },
  async uploadGroupAvatar(groupId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const tokens = getStoredTokens();
    const finalHeaders = {};
    if (tokens?.accessToken) {
      finalHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
    }

    const res = await fetch(`${GATEWAY_BASE_URL}/document-service/api/documents/upload/group-avatar?groupId=${encodeURIComponent(groupId)}` , {
      method: 'POST',
      headers: finalHeaders,
      body: formData
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.message || data?.error || res.statusText;
      const error = new Error(message || "Upload failed");
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data?.data || data;
  },
  async deleteFolder(folderId) {
    const data = await request(`/document-service/api/folders/${folderId}`, {
      method: "DELETE"
    });
    return data?.data || data;
  },
  async deleteFile(fileId) {
    const data = await request(`/document-service/api/files/${fileId}`, {
      method: "DELETE"
    });
    return data?.data || data;
  },
  async toggleFavorite(targetId, type) {
    const data = await request(`/document-service/api/favorites?id=${targetId}&type=${type}`, {
      method: "POST"
    });
    // Ensure we return a boolean value
    const result = data?.data !== undefined ? data.data : data;
    return Boolean(result);
  },
  async getFavorites() {
    const data = await request("/document-service/api/favorites");
    return data?.data || data || [];
  },
  async shareItem(itemId, type, userIds, permission = "VIEWER") {
    const data = await request(`/document-service/api/items/${itemId}/share?type=${type}`, {
      method: "POST",
      body: { userIds, permission }
    });
    return data?.data || data;
  },
  async unshareItem(itemId, type, userIds) {
    const data = await request(`/document-service/api/items/${itemId}/unshare?type=${type}`, {
      method: "POST",
      body: { userIds }
    });
    return data?.data || data;
  },
  async searchDocuments(query) {
    const data = await request(`/document-service/api/search?q=${encodeURIComponent(query)}`);
    return data?.data || data || [];
  },
  // Get users for sharing
  async getUsersForSharing() {
    const data = await request("/user-service/users/basic-infos");
    return data?.data || data || [];
  },
  // Update folder permission
	async updateFolderPermission(folderId, permission) {
		const data = await request(`/document-service/api/folders/${folderId}/permission?permission=${permission}`, {
			method: "PATCH"
		});
		return data?.data || data;
	},

	async updateFilePermission(fileId, permission) {
		const data = await request(`/document-service/api/files/${fileId}/permission?permission=${permission}`, {
			method: "PATCH"
		});
		return data?.data || data;
	},
  // Rename folder
  async renameFolder(folderId, newName) {
    const data = await request(`/document-service/api/folders/${folderId}/rename`, {
      method: "PATCH",
      body: { name: newName }
    });
    return data?.data || data;
  },
  // Rename file
  async renameFile(fileId, newName) {
    const data = await request(`/document-service/api/files/${fileId}/rename`, {
      method: "PATCH",
      body: { name: newName }
    });
    return data?.data || data;
  },
  // Get shared users
  async getSharedUsers(itemId, type) {
    const data = await request(`/document-service/api/items/${itemId}/shared-users?type=${type}`);
    return data?.data || data || [];
  },
  // Update share permission
  async updateSharePermission(shareId, permission) {
    const data = await request(`/document-service/api/shares/${shareId}/permission`, {
      method: "PATCH",
      body: { permission }
    });
    return data?.data || data;
  },
  // Remove share
  async removeShare(shareId) {
    const data = await request(`/document-service/api/shares/${shareId}`, {
      method: "DELETE"
    });
    return data?.data || data;
  },

  // Move folder
  async moveFolder(folderId, newParentId) {
    const params = new URLSearchParams();
    if (newParentId) params.append('parentId', newParentId);
    
    const data = await request(`/document-service/api/folders/${folderId}/move?${params}`, {
      method: "PATCH"
    });
    return data?.data || data;
  },

  // Move file
  async moveFile(fileId, newFolderId) {
    const params = new URLSearchParams();
    if (newFolderId) params.append('folderId', newFolderId);
    
    const data = await request(`/document-service/api/files/${fileId}/move?${params}`, {
      method: "PATCH"
    });
    return data?.data || data;
  }
};

export { getStoredTokens, setStoredTokens, GATEWAY_BASE_URL };


