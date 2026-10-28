import { fetchApi } from "../../lib/api";

/** Ignore retired reads without aborting fetch during React effect cleanup. */
export function startAdminRead<T>(
  path: string,
  callbacks: {
    success: (result: T) => void;
    error: (reason: unknown) => void;
    settled: () => void;
  },
): () => void {
  let active = true;
  async function read() {
    try {
      const result = await fetchApi<T>(path);
      if (active) callbacks.success(result);
    } catch (reason) {
      if (active) callbacks.error(reason);
    } finally {
      if (active) callbacks.settled();
    }
  }
  void read();
  return () => {
    active = false;
  };
}
