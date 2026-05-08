import { renderHook, act } from '@testing-library/react';
import { useClipManager } from './useClipManager';
import { Clip } from '../types/clip';

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

  describe('handleExportClip', () => {
    const mockFFmpeg = {
      loaded: true,
      loading: false,
      load: vi.fn().mockResolvedValue(undefined),
      trim: vi
        .fn()
        .mockResolvedValue(new Blob(['video'], { type: 'video/mp4' })),
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    it('exports a clip and sets status to done', async () => {
      const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      let currentTime = 5;
      const { result, rerender } = renderHook(() =>
        useClipManager(currentTime, 60, videoFile, undefined, mockFFmpeg)
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
      await act(async () => {
        await result.current.handleExportClip(clipId);
      });

      expect(result.current.clips[0].status).toBe('done');
      expect(result.current.clips[0].outputUrl).toBeTruthy();
    });

    it('sets status to error on trim failure', async () => {
      const failFFmpeg = {
        ...mockFFmpeg,
        trim: vi.fn().mockRejectedValue(new Error('Trim failed')),
      };
      const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      let currentTime = 5;
      const { result, rerender } = renderHook(() =>
        useClipManager(currentTime, 60, videoFile, undefined, failFFmpeg)
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
      await act(async () => {
        await result.current.handleExportClip(clipId);
      });

      expect(result.current.clips[0].status).toBe('error');
      expect(result.current.clips[0].error).toBe('Trim failed');
    });

    it('does nothing without videoFile', async () => {
      const { result } = renderHook(() =>
        useClipManager(0, 60, undefined, undefined, mockFFmpeg)
      );

      await act(async () => {
        await result.current.handleExportClip('non-existent');
      });
      // Should not throw
    });

    it('calls load() if ffmpeg not loaded yet', async () => {
      const unloadedFFmpeg = {
        ...mockFFmpeg,
        loaded: false,
        load: vi.fn().mockResolvedValue(undefined),
      };
      const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      let currentTime = 5;
      const { result, rerender } = renderHook(() =>
        useClipManager(currentTime, 60, videoFile, undefined, unloadedFFmpeg)
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
      await act(async () => {
        await result.current.handleExportClip(clipId);
      });

      expect(unloadedFFmpeg.load).toHaveBeenCalled();
    });
  });

  describe('handleExportAll', () => {
    const mockFFmpeg = {
      loaded: true,
      loading: false,
      load: vi.fn().mockResolvedValue(undefined),
      trim: vi
        .fn()
        .mockResolvedValue(new Blob(['video'], { type: 'video/mp4' })),
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    it('exports all pending clips and calls cleanup', async () => {
      const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      let currentTime = 5;
      const { result, rerender } = renderHook(() =>
        useClipManager(currentTime, 60, videoFile, undefined, mockFFmpeg)
      );

      // Create two clips
      act(() => {
        result.current.handleMarkStart();
      });
      currentTime = 15;
      rerender();
      act(() => {
        result.current.handleMarkEnd();
      });

      currentTime = 20;
      rerender();
      act(() => {
        result.current.handleMarkStart();
      });
      currentTime = 30;
      rerender();
      act(() => {
        result.current.handleMarkEnd();
      });

      await act(async () => {
        await result.current.handleExportAll();
      });

      expect(result.current.clips[0].status).toBe('done');
      expect(result.current.clips[1].status).toBe('done');
      expect(mockFFmpeg.cleanup).toHaveBeenCalled();
    });

    it('does nothing without videoFile', async () => {
      const { result } = renderHook(() =>
        useClipManager(0, 60, undefined, undefined, mockFFmpeg)
      );
      await act(async () => {
        await result.current.handleExportAll();
      });
      // Should not throw
    });
  });

  describe('handlePreviewClip', () => {
    it('plays video from clip start time', () => {
      const mockVideo = {
        currentTime: 0,
        play: vi.fn(),
        pause: vi.fn(),
      } as unknown as HTMLVideoElement;
      const videoRef = { current: mockVideo };
      const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      let currentTime = 5;
      const { result, rerender } = renderHook(() =>
        useClipManager(currentTime, 60, videoFile, videoRef)
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
        result.current.handlePreviewClip(clipId);
      });

      expect(mockVideo.currentTime).toBe(5);
      expect(mockVideo.play).toHaveBeenCalled();
    });

    it('does nothing with no videoRef', () => {
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
        result.current.handlePreviewClip(clipId);
      });
      // Should not throw
    });
  });

  describe('overlappingClipIds', () => {
    it('detects overlapping clips', () => {
      let currentTime = 5;
      const { result, rerender } = renderHook(() =>
        useClipManager(currentTime, 60)
      );

      // Clip 1: 5-15
      act(() => {
        result.current.handleMarkStart();
      });
      currentTime = 15;
      rerender();
      act(() => {
        result.current.handleMarkEnd();
      });

      // Clip 2: 10-20 (overlaps with clip 1)
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

      expect(result.current.overlappingClipIds.size).toBe(2);
    });
  });

  describe('handleExportAll error handling', () => {
    it('sets error status on individual clip trim failure', async () => {
      const failOnSecond = vi
        .fn()
        .mockResolvedValueOnce(new Blob(['ok'], { type: 'video/mp4' }))
        .mockRejectedValueOnce(new Error('Clip 2 failed'));

      const mockFFmpeg = {
        loaded: true,
        loading: false,
        load: vi.fn().mockResolvedValue(undefined),
        trim: failOnSecond,
        cleanup: vi.fn().mockResolvedValue(undefined),
      };

      const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      let currentTime = 5;
      const { result, rerender } = renderHook(() =>
        useClipManager(currentTime, 60, videoFile, undefined, mockFFmpeg)
      );

      act(() => {
        result.current.handleMarkStart();
      });
      currentTime = 15;
      rerender();
      act(() => {
        result.current.handleMarkEnd();
      });

      currentTime = 20;
      rerender();
      act(() => {
        result.current.handleMarkStart();
      });
      currentTime = 30;
      rerender();
      act(() => {
        result.current.handleMarkEnd();
      });

      await act(async () => {
        await result.current.handleExportAll();
      });

      expect(result.current.clips[0].status).toBe('done');
      expect(result.current.clips[1].status).toBe('error');
      expect(result.current.clips[1].error).toBe('Clip 2 failed');
    });
  });

  it('handleMarkEnd does nothing when clipStart is null', () => {
    const { result } = renderHook(() => useClipManager(10, 60));
    act(() => {
      result.current.handleMarkEnd();
    });
    expect(result.current.clips).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('handleDeleteClip revokes outputUrl', () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
    const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
    const mockFFmpeg = {
      loaded: true,
      loading: false,
      load: vi.fn().mockResolvedValue(undefined),
      trim: vi
        .fn()
        .mockResolvedValue(new Blob(['video'], { type: 'video/mp4' })),
      cleanup: vi.fn().mockResolvedValue(undefined),
    };

    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60, videoFile, undefined, mockFFmpeg)
    );

    act(() => {
      result.current.handleMarkStart();
    });
    currentTime = 15;
    rerender();
    act(() => {
      result.current.handleMarkEnd();
    });

    // Manually set outputUrl on clip
    const clipId = result.current.clips[0].id;
    act(() => {
      result.current.handleUpdateClip(clipId, {
        outputUrl: 'blob:http://localhost/fake',
      } as Partial<Clip>);
    });

    act(() => {
      result.current.handleDeleteClip(clipId);
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake');
    revokeObjectURL.mockRestore();
  });
});
