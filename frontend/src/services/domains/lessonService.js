import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const lessonService = {
  async create(payload) {
    const res = await httpClient.post("/lessons", payload);
    return extractApiData(res);
  },
  async update(id, payload) {
    const res = await httpClient.put(`/lessons/${id}`, payload);
    return extractApiData(res);
  },
  async delete(id) {
    const res = await httpClient.delete(`/lessons/${id}`);
    return extractApiData(res);
  },
  async reorder(items) {
    const res = await httpClient.put("/lessons/reorder", items);
    return extractApiData(res);
  },
};
