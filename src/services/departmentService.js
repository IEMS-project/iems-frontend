import { api } from "../lib/api";

export const departmentService = {
  async getDepartments() {
    return api.getDepartments();
  },
  async getDepartmentById(id) {
    return api.getDepartmentById(id);
  },
  async getDepartmentWithUsers(id) {
    return api.getDepartmentWithUsers(id);
  },
  async createDepartment(payload) {
    // payload: { departmentName, description, managerId }
    return api.createDepartment(payload);
  },
  async updateDepartment(id, payload) {
    // payload: { departmentName, description, managerId }
    return api.updateDepartment(id, payload);
  },
  async deleteDepartment(id) {
    return api.deleteDepartment(id);
  },
};

