import React from "react";

const LoadingState = ({ label = "Đang tải dữ liệu...", fullHeight = false }) => (
  <div className={`flex items-center justify-center gap-3 ${fullHeight ? "min-h-[60vh]" : "py-8"}`}>
    <div className="w-7 h-7 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
    <span className="text-sm font-semibold text-slate-500">{label}</span>
  </div>
);

export default LoadingState;

