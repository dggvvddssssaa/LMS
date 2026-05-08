import React from "react";

const EmptyState = ({ title = "Chưa có dữ liệu", description = "", action = null }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <h3 className="text-lg font-bold text-slate-700">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-2">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;

