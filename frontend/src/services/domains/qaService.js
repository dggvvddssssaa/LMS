import httpClient from "../core/httpClient";
import { extractApiData } from "../core/apiResult";

export const qaService = {
  async getQuestions(courseId, lessonId) {
    const url = lessonId
      ? `/qa/course/${courseId}?lessonId=${lessonId}`
      : `/qa/course/${courseId}`;
    const res = await httpClient.get(url);
    return extractApiData(res);
  },
  async postQuestion(payload) {
    const res = await httpClient.post("/qa/question", payload);
    return extractApiData(res);
  },
  async postAnswer(payload) {
    const res = await httpClient.post("/qa/answer", payload);
    return extractApiData(res);
  },
  async acceptAnswer(answerId) {
    const res = await httpClient.put(`/qa/answer/${answerId}/accept`);
    return extractApiData(res);
  },
};

