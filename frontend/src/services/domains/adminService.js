import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const adminService = {
  async getUsers() {
    const res = await httpClient.get("/users");
    return extractApiData(res);
  },
  async createUser(payload) {
    const res = await httpClient.post("/users", payload);
    return extractApiData(res);
  },
  async deleteUser(id) {
    const res = await httpClient.delete(`/users/${id}`);
    return extractApiData(res);
  },
  async verifyInstructor(id) {
    const res = await httpClient.put(`/users/${id}/verify`);
    return extractApiData(res);
  },
  async getUserDetails(id) {
    const res = await httpClient.get(`/users/${id}/details`);
    return extractApiData(res);
  },
  async getDashboardStats() {
    const res = await httpClient.get("/stats/dashboard");
    return extractApiData(res);
  },
  async giftCourse(userId, courseIds) {
    const res = await httpClient.post(`/users/${userId}/gift-course`, { courseIds });
    return extractApiData(res);
  },
};

