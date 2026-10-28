import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/api', () => ({ fetchApi: vi.fn() }));
import { fetchApi } from '../lib/api';
import { startAdminRead } from '../react/admin/adminRead';

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
const callbacks = () => ({ success: vi.fn(), error: vi.fn(), settled: vi.fn() });
beforeEach(() => vi.mocked(fetchApi).mockReset());

describe('admin read lifecycle', () => {
  it('survives Strict Mode setup, cleanup and setup without aborting either fetch', async () => {
    const first = deferred();
    const second = deferred();
    vi.mocked(fetchApi).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const retired = callbacks();
    const current = callbacks();
    const cleanup = startAdminRead('/admin/settings', retired);
    cleanup();
    startAdminRead('/admin/settings', current);
    first.resolve({ data: 'old' });
    second.resolve({ data: 'current' });
    await Promise.all([first.promise, second.promise]);
    expect(fetchApi).toHaveBeenNthCalledWith(1, '/admin/settings');
    expect(fetchApi).toHaveBeenNthCalledWith(2, '/admin/settings');
    expect(retired.success).not.toHaveBeenCalled();
    expect(retired.settled).not.toHaveBeenCalled();
    expect(current.success).toHaveBeenCalledWith({ data: 'current' });
    expect(current.settled).toHaveBeenCalledOnce();
  });

  it('handles rejection after navigation without updating the retired view', async () => {
    const pending = deferred();
    vi.mocked(fetchApi).mockReturnValueOnce(pending.promise);
    const view = callbacks();
    startAdminRead('/admin/orders', view)();
    pending.reject(new DOMException('The request was aborted', 'AbortError'));
    await pending.promise.catch(() => {});
    expect(view.success).not.toHaveBeenCalled();
    expect(view.error).not.toHaveBeenCalled();
    expect(view.settled).not.toHaveBeenCalled();
  });

  it('keeps a late response from overwriting a newer result', async () => {
    const oldRequest = deferred();
    const newRequest = deferred();
    vi.mocked(fetchApi).mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const view = callbacks();
    const retire = startAdminRead('/admin/products', view);
    retire();
    startAdminRead('/admin/products', view);
    newRequest.resolve({ data: ['updated product'] });
    await newRequest.promise;
    oldRequest.resolve({ data: ['stale product'] });
    await oldRequest.promise;
    expect(view.success).toHaveBeenCalledOnce();
    expect(view.success).toHaveBeenCalledWith({ data: ['updated product'] });
  });

  it('still reports genuine request failures and finishes loading', async () => {
    const failure = new Error('Service unavailable');
    vi.mocked(fetchApi).mockRejectedValueOnce(failure);
    const view = callbacks();
    startAdminRead('/admin/settings', view);
    await Promise.resolve();
    expect(view.error).toHaveBeenCalledWith(failure);
    expect(view.settled).toHaveBeenCalledOnce();
    expect(view.success).not.toHaveBeenCalled();
  });
});
