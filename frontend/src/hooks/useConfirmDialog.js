import { useCallback, useState } from "react";

export default function useConfirmDialog() {
  const [state, setState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Xác nh?n",
    cancelText: "H?y",
    variant: "danger",
    onConfirm: null,
  });

  const openConfirm = useCallback((options) => {
    setState({
      isOpen: true,
      title: options.title || "Xác nh?n thao tác",
      message: options.message || "",
      confirmText: options.confirmText || "Xác nh?n",
      cancelText: options.cancelText || "H?y",
      variant: options.variant || "danger",
      onConfirm: options.onConfirm || null,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.onConfirm) {
      state.onConfirm();
    }
    closeConfirm();
  }, [closeConfirm, state]);

  return {
    confirmState: state,
    openConfirm,
    closeConfirm,
    handleConfirm,
  };
}

