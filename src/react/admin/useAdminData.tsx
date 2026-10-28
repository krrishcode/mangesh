import { useCallback, useEffect, useRef, useState } from "react";
import { startAdminRead } from "./adminRead";

export function useAdminData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);
  useEffect(() => {
    setLoading(true);
    setError("");
    return startAdminRead<{ data: T }>(path, {
      success: (result) => setData(result.data),
      error: (reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load this module.",
        ),
      settled: () => setLoading(false),
    });
  }, [path, version]);
  return { data, loading, error, reload };
}

export function AdminError({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="admin-error-notice" role="alert">
      <span>{message}</span>
      {retry && (
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={retry}
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function useAdminAction() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const clearError = useCallback(() => setError(""), []);
  async function run(action: () => Promise<unknown>) {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to save this change.",
      );
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return { run, error, busy, clearError };
}
