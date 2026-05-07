import { renderHook, act } from '@testing-library/react';
import { useClipManager } from './useClipManager';

describe('useClipManager', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useClipManager(0, 60));
    expect(result.current.clips).toEqual([]);
    expect(result.current.clipStart).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handleMarkStart sets clipStart to currentTime', () => {
    const { result } = renderHook(() => useClipManager(10, 60));
    act(() => {
      result.current.handleMarkStart();
    });
    expect(result.current.clipStart).toBe(10);
  });

  it('handleMarkEnd creates a valid clip and resets clipStart', () => {
    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60)
    );

    act(() => {
      result.current.handleMarkStart();
    });

    currentTime = 15;
    rerender();

    act(() => {
      result.current.handleMarkEnd();
    });

    expect(result.current.clips).toHaveLength(1);
    expect(result.current.clips[0].startTime).toBe(5);
    expect(result.current.clips[0].endTime).toBe(15);
    expect(result.current.clips[0].status).toBe('pending');
    expect(result.current.clipStart).toBeNull();
  });

  it('handleMarkEnd sets error for invalid clip', () => {
    let currentTime = 10;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60)
    );

    act(() => {
      result.current.handleMarkStart();
    });

    currentTime = 5;
    rerender();

    act(() => {
      result.current.handleMarkEnd();
    });

    expect(result.current.clips).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });

  it('handleDeleteClip removes a clip by id', () => {
    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60)
    );

    act(() => {
      result.current.handleMarkStart();
    });
    currentTime = 15;
    rerender();
    act(() => {
      result.current.handleMarkEnd();
    });

    const clipId = result.current.clips[0].id;
    act(() => {
      result.current.handleDeleteClip(clipId);
    });

    expect(result.current.clips).toHaveLength(0);
  });

  it('handleUpdateClip updates a clip label', () => {
    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60)
    );

    act(() => {
      result.current.handleMarkStart();
    });
    currentTime = 15;
    rerender();
    act(() => {
      result.current.handleMarkEnd();
    });

    const clipId = result.current.clips[0].id;
    act(() => {
      result.current.handleUpdateClip(clipId, { label: 'Intro' });
    });

    expect(result.current.clips[0].label).toBe('Intro');
  });

  it('auto-generates incrementing labels', () => {
    let currentTime = 0;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60)
    );

    // Create first clip
    act(() => {
      result.current.handleMarkStart();
    });
    currentTime = 5;
    rerender();
    act(() => {
      result.current.handleMarkEnd();
    });

    // Create second clip
    currentTime = 10;
    rerender();
    act(() => {
      result.current.handleMarkStart();
    });
    currentTime = 20;
    rerender();
    act(() => {
      result.current.handleMarkEnd();
    });

    expect(result.current.clips[0].label).toBe('Clip 1');
    expect(result.current.clips[1].label).toBe('Clip 2');
  });
});
