import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const authService = {
  async login(payload) {
    const res = await httpClient.post("/auth/login", payload);
    return extractApiData(res);
  },
  async register(payload) {
    const res = await httpClient.post("/auth/register", payload);
    return extractApiData(res);
  },
};

