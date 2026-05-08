import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const certificateService = {
  async getById(id) {
    const res = await httpClient.get(`/certificates/${id}`);
    return extractApiData(res);
  },
  async getByCourse(courseId) {
    const res = await httpClient.get(`/certificates/course/${courseId}`);
    return extractApiData(res);
  },
  async getAll() {
    const res = await httpClient.get("/certificates");
    return extractApiData(res);
  },
  async generate(courseId) {
    const res = await httpClient.post(`/certificates/generate/${courseId}`);
    return extractApiData(res);
  },
};
