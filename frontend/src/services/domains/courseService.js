import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const courseService = {
  async getPublishedCourses() {
    const res = await httpClient.get("/courses?is_published=true");
    return extractApiData(res);
  },
  async getCourseById(id) {
    const res = await httpClient.get(`/courses/${id}`);
    return extractApiData(res);
  },
  async getCategories() {
    const res = await httpClient.get("/categories");
    return extractApiData(res);
  },
  async getLearningOutline(id) {
    const res = await httpClient.get(`/courses/${id}/learning-outline`);
    return extractApiData(res);
  },
  async getMyCourses() {
    const res = await httpClient.get("/enrollments/my-courses");
    return extractApiData(res);
  },
  async getCourses() {
    const res = await httpClient.get("/courses");
    return extractApiData(res);
  },
  async createCourse(payload) {
    const res = await httpClient.post("/courses", payload);
    return extractApiData(res);
  },
  async updateCourse(id, payload) {
    const res = await httpClient.put(`/courses/${id}`, payload);
    return extractApiData(res);
  },
  async deleteCourse(id) {
    const res = await httpClient.delete(`/courses/${id}`);
    return extractApiData(res);
  },
};

