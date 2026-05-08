import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const liveClassService = {
  async getByCourse(courseId) {
    const res = await httpClient.get(`/live-classes/course/${courseId}`);
    return extractApiData(res);
  },
  async create(payload) {
    const res = await httpClient.post("/live-classes", payload);
    return extractApiData(res);
  },
  async getMonitor() {
    const res = await httpClient.get("/live-classes/monitor");
    return extractApiData(res);
  },
};
