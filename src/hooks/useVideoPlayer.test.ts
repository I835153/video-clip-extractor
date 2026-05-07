import { renderHook, act } from '@testing-library/react';
import { useVideoPlayer } from './useVideoPlayer';

describe('useVideoPlayer', () => {
  it('returns initial values', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useVideoPlayer(ref));

    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it('seek() clamps to valid range', () => {
    const mockVideo = {
      currentTime: 0,
      duration: 10,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLVideoElement;

    const ref = { current: mockVideo };
    const { result } = renderHook(() => useVideoPlayer(ref));

    act(() => {
      result.current.seek(-5);
    });
    expect(mockVideo.currentTime).toBe(0);

    act(() => {
      result.current.seek(20);
    });
    expect(mockVideo.currentTime).toBe(10);

    act(() => {
      result.current.seek(5);
    });
    expect(mockVideo.currentTime).toBe(5);
  });
});
