import { request } from "@/lib/api";

export const documentService = {
  async getAllFolders() {
    const data = await request("/document-service/api/folders");
    return data?.data || data || [];
  },

  async getAllFiles() {
    const data = await request("/document-service/api/files");
    return data?.data || data || [];
  },

  async getFolderContents(folderId) {
    const data = await request(`/document-service/api/folders/${folderId}/contents`);
    return data?.data || data || [];
  },

  async createFolder(name, parentId = null) {
    const data = await request("/document-service/api/folders", {
      method: "POST",
      body: { name, parentId },
    });
    return data?.data || data;
  },

  async uploadFile(folderId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const data = await request(`/document-service/api/files/upload?folderId=${folderId || ""}`, {
      method: "POST",
      body: formData,
    });
    return data?.data || data;
  },

  async uploadGroupAvatar(groupId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const data = await request(`/document-service/api/documents/upload/group-avatar?groupId=${encodeURIComponent(groupId)}`, {
      method: "POST",
      body: formData,
    });
    return data?.data || data;
  },

  async toggleFavorite(id, type) {
    const data = await request(`/document-service/api/favorites?id=${id}&type=${type}`, {
      method: "POST",
    });
    const result = data?.data !== undefined ? data.data : data;
    return Boolean(result);
  },

  async getFavorites() {
    const data = await request("/document-service/api/favorites");
    return data?.data || data || [];
  },

  async deleteFolder(id) {
    const data = await request(`/document-service/api/folders/${id}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async deleteFile(id) {
    const data = await request(`/document-service/api/files/${id}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async shareItem(id, type, userIds, permission = "VIEWER") {
    const data = await request(`/document-service/api/items/${id}/share?type=${type}`, {
      method: "POST",
      body: { userIds, permission },
    });
    return data?.data || data;
  },

  async unshareItem(id, type, userIds) {
    const data = await request(`/document-service/api/items/${id}/unshare?type=${type}`, {
      method: "POST",
      body: { userIds },
    });
    return data?.data || data;
  },

  async getSharedUsers(id, type) {
    const data = await request(`/document-service/api/items/${id}/shared-users?type=${type}`);
    return data?.data || data || [];
  },

  async getItemActivities(id, type) {
    const data = await request(`/document-service/api/items/${id}/activities?type=${type}`);
    return data?.data || data || [];
  },

  async updateSharePermission(shareId, permission) {
    const data = await request(`/document-service/api/shares/${shareId}/permission`, {
      method: "PATCH",
      body: { permission },
    });
    return data?.data || data;
  },

  async removeShare(shareId) {
    const data = await request(`/document-service/api/shares/${shareId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async renameFolder(id, newName) {
    const data = await request(`/document-service/api/folders/${id}/rename`, {
      method: "PATCH",
      body: { name: newName },
    });
    return data?.data || data;
  },

  async renameFile(id, newName) {
    const data = await request(`/document-service/api/files/${id}/rename`, {
      method: "PATCH",
      body: { name: newName },
    });
    return data?.data || data;
  },

  async updateFolderPermission(id, permission) {
    const data = await request(`/document-service/api/folders/${id}/permission?permission=${permission}`, {
      method: "PATCH",
    });
    return data?.data || data;
  },

  async updateFilePermission(id, permission) {
    const data = await request(`/document-service/api/files/${id}/permission?permission=${permission}`, {
      method: "PATCH",
    });
    return data?.data || data;
  },

  async moveFolder(folderId, newParentId) {
    const params = new URLSearchParams();
    if (newParentId) params.append("parentId", newParentId);
    const query = params.toString();
    const data = await request(`/document-service/api/folders/${folderId}/move${query ? `?${query}` : ""}`, {
      method: "PATCH",
    });
    return data?.data || data;
  },

  async moveFile(fileId, newFolderId) {
    const params = new URLSearchParams();
    if (newFolderId) params.append("folderId", newFolderId);
    const query = params.toString();
    const data = await request(`/document-service/api/files/${fileId}/move${query ? `?${query}` : ""}`, {
      method: "PATCH",
    });
    return data?.data || data;
  },

  async searchDocuments(query) {
    const data = await request(`/document-service/api/search?q=${encodeURIComponent(query)}`);
    return data?.data || data || [];
  },

  async batchDelete(fileIds = [], folderIds = []) {
    const data = await request("/document-service/api/batch-delete", {
      method: "POST",
      body: { fileIds, folderIds },
    });
    return data?.data || data;
  },

  async batchMove(fileIds = [], folderIds = [], destinationFolderId = null) {
    const data = await request("/document-service/api/batch-move", {
      method: "POST",
      body: { fileIds, folderIds, destinationFolderId },
    });
    return data?.data || data;
  },

  // Trash APIs
  async getTrash() {
    const data = await request("/document-service/api/trash");
    return data?.data || data || [];
  },

  async restoreFile(fileId) {
    const data = await request(`/document-service/api/trash/files/${fileId}/restore`, {
      method: "POST",
    });
    return data?.data || data;
  },

  async restoreFolder(folderId) {
    const data = await request(`/document-service/api/trash/folders/${folderId}/restore`, {
      method: "POST",
    });
    return data?.data || data;
  },

  async permanentDeleteFile(fileId) {
    const data = await request(`/document-service/api/trash/files/${fileId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async permanentDeleteFolder(folderId) {
    const data = await request(`/document-service/api/trash/folders/${folderId}`, {
      method: "DELETE",
    });
    return data?.data || data;
  },

  async emptyTrash() {
    const data = await request("/document-service/api/trash/empty", {
      method: "DELETE",
    });
    return data?.data || data;
  },
};
