import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const statsService = {
  async getDashboard() {
    const res = await httpClient.get("/stats/dashboard");
    return extractApiData(res);
  },
};
