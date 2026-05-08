export const createAppError = ({
  message = "Đã xảy ra lỗi. Vui lòng thử lại.",
  code = "UNKNOWN",
  status = null,
  details = null,
} = {}) => ({
  message,
  code,
  status,
  details,
});

export const normalizeError = (error, fallbackMessage = "Đã xảy ra lỗi. Vui lòng thử lại.") => {
  const status = error?.response?.status || null;
  const payload = error?.response?.data || null;

  return createAppError({
    message: payload?.message || error?.message || fallbackMessage,
    code: payload?.code || error?.code || "UNKNOWN",
    status,
    details: payload,
  });
};

