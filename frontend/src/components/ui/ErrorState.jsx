import React from "react";

const ErrorState = ({ title = "Không thể tải dữ liệu", message, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-3xl border border-red-100">
    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-200">
      ⚠️
    </div>
    <h3 className="text-xl font-black text-red-800 mb-2">{title}</h3>
    {message && <p className="text-sm font-medium text-red-600 mb-6 max-w-md">{message}</p>}
    
    <div className="flex items-center gap-3 mt-2">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-md shadow-red-500/20 transition-all active:scale-95"
        >
          🔄 Thử lại
        </button>
      )}
      <button 
        onClick={() => window.history.back()}
        className="px-6 py-2.5 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 border border-slate-200 transition-all active:scale-95"
      >
        🔙 Quay lại
      </button>
    </div>
  </div>
);

export default ErrorState;
