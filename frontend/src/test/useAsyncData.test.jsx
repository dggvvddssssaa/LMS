import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import useAsyncData from '../hooks/useAsyncData';

describe('useAsyncData', () => {
  test('loads data successfully', async () => {
    const fn = vi.fn().mockResolvedValue({ items: [1, 2, 3] });
    const { result } = renderHook(() => useAsyncData(fn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ items: [1, 2, 3] });
    expect(result.current.error).toBeNull();
  });

  test('handles error state', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network fail'));
    const { result } = renderHook(() => useAsyncData(fn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toBe('Network fail');
  });
});
