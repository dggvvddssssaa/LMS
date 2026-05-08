import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const notificationService = {
  async getNotifications() {
    const res = await httpClient.get("/notifications");
    return extractApiData(res);
  },
  async markAsRead(id) {
    const res = await httpClient.put(`/notifications/${id}/read`);
    return extractApiData(res);
  },
  async markAllAsRead() {
    const res = await httpClient.put("/notifications/read-all");
    return extractApiData(res);
  },
};

