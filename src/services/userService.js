import { api } from "../lib/api";

export const userService = {
  async getAllUsers() {
    return api.getAllUsers();
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
};


