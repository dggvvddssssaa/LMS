import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const assignmentService = {
  async getByLesson(lessonId) {
    const res = await httpClient.get(`/assignments/lesson/${lessonId}`);
    return extractApiData(res);
  },
  async create(payload) {
    const res = await httpClient.post("/assignments", payload);
    return extractApiData(res);
  },
  async update(id, payload) {
    const res = await httpClient.put(`/assignments/${id}`, payload);
    return extractApiData(res);
  },
  async delete(id) {
    const res = await httpClient.delete(`/assignments/${id}`);
    return extractApiData(res);
  },
  async getSubmission(assignmentId) {
    const res = await httpClient.get(`/assignments/${assignmentId}/submission`);
    return extractApiData(res);
  },
  async submit(assignmentId, answers) {
    const res = await httpClient.post(`/assignments/${assignmentId}/submit`, { answers });
    return extractApiData(res);
  },
};
