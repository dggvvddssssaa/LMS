import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const materialService = {
  async getByCourse(courseId) {
    const res = await httpClient.get(`/materials/${courseId}`);
    return extractApiData(res);
  },
  async create(payload) {
    const res = await httpClient.post("/materials", payload);
    return extractApiData(res);
  },
  async delete(id) {
    const res = await httpClient.delete(`/materials/${id}`);
    return extractApiData(res);
  },
};
