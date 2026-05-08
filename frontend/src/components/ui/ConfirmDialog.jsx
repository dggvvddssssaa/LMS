import React from "react";
import AppModal from "./AppModal";

const ConfirmDialog = ({
  isOpen,
  title = "Xác nhận thao tác",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  const confirmClass = variant === "danger"
    ? "bg-red-600 hover:bg-red-700"
    : "bg-blue-600 hover:bg-blue-700";

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={(
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-white font-bold ${confirmClass}`}>
            {confirmText}
          </button>
        </div>
      )}
    >
      <p className="text-sm text-slate-600">{message}</p>
    </AppModal>
  );
};

export default ConfirmDialog;

