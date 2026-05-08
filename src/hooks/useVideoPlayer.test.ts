import { renderHook, act } from '@testing-library/react';
import { useVideoPlayer } from './useVideoPlayer';

function createMockVideo(currentTime = 0, duration = 60) {
  return {
    currentTime,
    duration,
    readyState: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLVideoElement;
}

describe('useVideoPlayer', () => {
  it('returns initial values', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useVideoPlayer(ref));

    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it('seek() clamps to valid range', () => {
    const mockVideo = createMockVideo(0, 10);
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

  it('stepForward advances current time', () => {
    const mockVideo = createMockVideo(5, 60);
    const ref = { current: mockVideo };
    const { result } = renderHook(() => useVideoPlayer(ref));

    act(() => {
      result.current.stepForward(2);
    });
    expect(mockVideo.currentTime).toBe(7);
  });

  it('stepBackward decreases current time', () => {
    const mockVideo = createMockVideo(5, 60);
    const ref = { current: mockVideo };
    const { result } = renderHook(() => useVideoPlayer(ref));

    act(() => {
      result.current.stepBackward(2);
    });
    expect(mockVideo.currentTime).toBe(3);
  });

  it('sets duration when readyState >= 1', () => {
    const mockVideo = createMockVideo(0, 120);
    Object.defineProperty(mockVideo, 'readyState', { value: 2 });
    const ref = { current: mockVideo };
    const { result } = renderHook(() => useVideoPlayer(ref, 'test.mp4'));

    expect(result.current.duration).toBe(120);
  });

  it('listens to timeupdate events', () => {
    const mockVideo = createMockVideo(0, 60);
    const ref = { current: mockVideo };
    renderHook(() => useVideoPlayer(ref, 'test.mp4'));

    expect(mockVideo.addEventListener).toHaveBeenCalledWith(
      'timeupdate',
      expect.any(Function)
    );
    expect(mockVideo.addEventListener).toHaveBeenCalledWith(
      'loadedmetadata',
      expect.any(Function)
    );
    expect(mockVideo.addEventListener).toHaveBeenCalledWith(
      'play',
      expect.any(Function)
    );
    expect(mockVideo.addEventListener).toHaveBeenCalledWith(
      'pause',
      expect.any(Function)
    );
  });

  it('fires event handlers to update state', () => {
    const handlers: Record<string, Function> = {};
    const mockVideo = {
      currentTime: 0,
      duration: 60,
      readyState: 0,
      addEventListener: vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLVideoElement;
    const ref = { current: mockVideo };
    const { result } = renderHook(() => useVideoPlayer(ref, 'test.mp4'));

    // Fire timeupdate
    Object.defineProperty(mockVideo, 'currentTime', {
      value: 25,
      writable: true,
    });
    act(() => {
      handlers['timeupdate']();
    });
    expect(result.current.currentTime).toBe(25);

    // Fire loadedmetadata
    Object.defineProperty(mockVideo, 'duration', {
      value: 120,
      writable: true,
    });
    act(() => {
      handlers['loadedmetadata']();
    });
    expect(result.current.duration).toBe(120);

    // Fire play
    act(() => {
      handlers['play']();
    });
    expect(result.current.isPlaying).toBe(true);

    // Fire pause
    act(() => {
      handlers['pause']();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('seek does nothing when video ref is null', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useVideoPlayer(ref));
    act(() => {
      result.current.seek(5);
    });
    expect(result.current.currentTime).toBe(0);
  });

  it('stepForward does nothing when video ref is null', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useVideoPlayer(ref));
    act(() => {
      result.current.stepForward(1);
    });
    expect(result.current.currentTime).toBe(0);
  });

  it('stepBackward does nothing when video ref is null', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useVideoPlayer(ref));
    act(() => {
      result.current.stepBackward(1);
    });
    expect(result.current.currentTime).toBe(0);
  });
});
