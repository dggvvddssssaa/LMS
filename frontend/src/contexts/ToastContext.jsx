import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((payload) => {
    const id = crypto.randomUUID();
    const toast = {
      id,
      type: payload.type || "info",
      title: payload.title || "Thông báo",
      message: payload.message || "",
      duration: payload.duration || 3000,
    };

    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }, [removeToast]);

  const value = useMemo(() => ({ pushToast, removeToast }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-[340px] max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-lg bg-white ${
              toast.type === "success"
                ? "border-green-200"
                : toast.type === "error"
                  ? "border-red-200"
                  : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">{toast.title}</p>
                {toast.message && <p className="text-sm text-slate-600 mt-1">{toast.message}</p>}
              </div>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => removeToast(toast.id)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
};

