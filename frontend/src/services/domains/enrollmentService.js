import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const enrollmentService = {
  async checkEnrollment(courseId) {
    const res = await httpClient.get(`/enrollments/check/${courseId}`);
    return extractApiData(res);
  },
  async checkout(courseId) {
    const res = await httpClient.post("/enrollments/checkout", { courseId });
    return extractApiData(res);
  },
  async confirmCheckout(transactionId) {
    const res = await httpClient.post("/enrollments/checkout/confirm", { transactionId });
    return extractApiData(res);
  },
  async getReceipts() {
    const res = await httpClient.get("/enrollments/receipts");
    return extractApiData(res);
  },
  async getProgress(courseId) {
    const res = await httpClient.get(`/progress/${courseId}`);
    return extractApiData(res);
  },
  async markLessonComplete(payload) {
    const res = await httpClient.post("/progress/mark-complete", payload);
    return extractApiData(res);
  },
};

