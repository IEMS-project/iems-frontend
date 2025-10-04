import { api } from "../lib/api";

export const documentService = {
  async getAllFolders() {
    return api.getAllFolders();
  },

  async getAllFiles() {
    return api.getAllFiles();
  },

  async getFolderContents(folderId) {
    return api.getFolderContents(folderId);
  },

  async createFolder(name, parentId) {
    return api.createFolder(name, parentId);
  },

  async uploadFile(folderId, file) {
    return api.uploadFile(folderId, file);
  },

  async toggleFavorite(id, type) {
    return api.toggleFavorite(id, type);
  },

  async deleteFolder(id) {
    return api.deleteFolder(id);
  },

  async deleteFile(id) {
    return api.deleteFile(id);
  },

  async shareItem(id, type, userIds, permission) {
    return api.shareItem(id, type, userIds, permission);
  },

  async getSharedUsers(id, type) {
    return api.getSharedUsers(id, type);
  },

  async renameFolder(id, newName) {
    return api.renameFolder(id, newName);
  },

  async renameFile(id, newName) {
    return api.renameFile(id, newName);
  },

  async updateFolderPermission(id, permission) {
    return api.updateFolderPermission(id, permission);
  },

  async updateFilePermission(id, permission) {
    return api.updateFilePermission(id, permission);
  }
};
