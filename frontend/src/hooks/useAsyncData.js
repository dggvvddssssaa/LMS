import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeError } from "../services/core/errors";

export default function useAsyncData(asyncFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const abortRef = useRef(null);

  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const execute = useCallback(async (...args) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFnRef.current({ signal: controller.signal }, ...args);
      setData(result);
      return result;
    } catch (err) {
      if (controller.signal.aborted) {
        return null;
      }

      const normalized = normalizeError(err);
      setError(normalized);
      throw normalized;
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!immediate) {
      return () => {
        if (abortRef.current) abortRef.current.abort();
      };
    }

    execute().catch(() => null);

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [execute, immediate]);

  return {
    data,
    error,
    loading,
    execute,
    retry: execute,
    setData,
  };
}

