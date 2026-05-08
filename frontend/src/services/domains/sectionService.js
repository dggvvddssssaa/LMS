import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const sectionService = {
  async create(payload) {
    const res = await httpClient.post("/sections", payload);
    return extractApiData(res);
  },
  async update(id, payload) {
    const res = await httpClient.put(`/sections/${id}`, payload);
    return extractApiData(res);
  },
  async delete(id) {
    const res = await httpClient.delete(`/sections/${id}`);
    return extractApiData(res);
  },
};
