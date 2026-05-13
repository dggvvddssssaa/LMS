import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const sessionService = {
  async getByLiveClass(liveClassId) {
    const res = await httpClient.get(`/sessions/live-class/${liveClassId}`);
    return extractApiData(res);
  },
  async create(payload) {
    const res = await httpClient.post("/sessions", payload);
    return extractApiData(res);
  },
  async update(id, payload) {
    const res = await httpClient.put(`/sessions/${id}`, payload);
    return extractApiData(res);
  },
  async delete(id) {
    const res = await httpClient.delete(`/sessions/${id}`);
    return extractApiData(res);
  },
  async openSession(id) {
    const res = await httpClient.put(`/sessions/${id}/open`);
    return extractApiData(res);
  },
  async endSession(id) {
    const res = await httpClient.put(`/sessions/${id}/end`);
    return extractApiData(res);
  },
  async getToday() {
    const res = await httpClient.get("/sessions/today");
    return extractApiData(res);
  },
  async getMyTeaching() {
    const res = await httpClient.get("/sessions/my-teaching");
    return extractApiData(res);
  },
  async getActive() {
    const res = await httpClient.get("/sessions/active");
    return extractApiData(res);
  },
};
