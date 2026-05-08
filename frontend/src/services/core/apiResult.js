export const createApiResult = ({ success = true, data = null, message = "", meta = null } = {}) => ({
  success,
  data,
  message,
  meta,
});

export const extractApiData = (response) => {
  const payload = response?.data;
  if (!payload) {
    return createApiResult({ success: false, message: "Empty response", data: null });
  }

  if (typeof payload.success === "boolean") {
    return createApiResult({
      success: payload.success,
      data: payload.data,
      message: payload.message || "",
      meta: payload.meta || null,
    });
  }

  return createApiResult({ success: true, data: payload });
};

