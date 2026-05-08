import React from "react";

const ErrorState = ({ title = "Không thể tải dữ liệu", message, onRetry }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
    <h3 className="text-lg font-bold text-red-700">{title}</h3>
    {message && <p className="text-sm text-red-600 mt-2">{message}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
      >
        Thử lại
      </button>
    )}
  </div>
);

export default ErrorState;

