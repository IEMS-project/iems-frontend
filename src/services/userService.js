import { api } from "../lib/api";

export const userService = {
  async getAllUsers() {
    return api.getAllUsers();
  },
  async getMyProfile() {
    return api.getMyProfile();
  },
  async getMyProfileInfo() {
    return api.getMyProfileInfo();
  },
  async updateMyProfile(payload) {
    return api.updateMyProfile(payload);
  },
  async updateMyAvatar(imageUrl) {
    return api.updateMyAvatar(imageUrl);
  },
  async getAllUserBasicInfos() {
    return api.getAllUserBasicInfos();
  },
  async getRoles() {
    return api.getRoles();
  },
  async getUserById(userId) {
    return api.getUserById(userId);
  },
  async getUsersByIds(userIds) {
    return api.getUsersByIds(userIds);
  },
  async uploadAvatar(file) {
    return api.uploadAvatar(file);
  },
};


