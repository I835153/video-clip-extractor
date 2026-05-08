import { renderHook, act } from '@testing-library/react';
import { useClipManager } from './useClipManager';
import { Clip } from '../types/clip';

describe('useClipManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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
      extractFrame: vi
        .fn()
        .mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
      setProgressCallback: vi.fn(),
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
      extractFrame: vi
        .fn()
        .mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
      setProgressCallback: vi.fn(),
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
        extractFrame: vi
          .fn()
          .mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
        setProgressCallback: vi.fn(),
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
      extractFrame: vi
        .fn()
        .mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
      setProgressCallback: vi.fn(),
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

  it('auto-generates thumbnail on handleMarkEnd when ffmpeg loaded', async () => {
    const mockFFmpeg = {
      loaded: true,
      loading: false,
      load: vi.fn().mockResolvedValue(undefined),
      trim: vi
        .fn()
        .mockResolvedValue(new Blob(['video'], { type: 'video/mp4' })),
      cleanup: vi.fn().mockResolvedValue(undefined),
      extractFrame: vi
        .fn()
        .mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
      setProgressCallback: vi.fn(),
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

    // Wait for the fire-and-forget extractFrame promise
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockFFmpeg.extractFrame).toHaveBeenCalledWith(videoFile, 10);
    expect(result.current.clips[0].thumbnailUrl).toBeTruthy();
  });

  it('handleSetThumbnailFromVideo captures canvas frame', async () => {
    const mockBlob = new Blob(['canvas-img'], { type: 'image/jpeg' });
    const mockCtx = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((cb: BlobCallback) => {
        cb(mockBlob);
      }),
    };
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return origCreateElement(tag);
    });

    const mockVideo = {
      currentTime: 0,
      videoWidth: 1920,
      videoHeight: 1080,
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
      result.current.handleSetThumbnailFromVideo(clipId);
    });

    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockVideo, 0, 0);
    expect(result.current.clips[0].thumbnailUrl).toBeTruthy();

    vi.restoreAllMocks();
  });

  it('handleDeleteClip revokes thumbnailUrl', () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
    const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });

    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60, videoFile)
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
      result.current.handleUpdateClip(clipId, {
        thumbnailUrl: 'blob:http://localhost/thumb',
      } as Partial<Clip>);
    });

    act(() => {
      result.current.handleDeleteClip(clipId);
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/thumb');
    revokeObjectURL.mockRestore();
  });

  it('resetClips clears all clips and revokes URLs', () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
    const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });

    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60, videoFile)
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
      result.current.handleUpdateClip(clipId, {
        outputUrl: 'blob:http://localhost/out',
        thumbnailUrl: 'blob:http://localhost/thumb2',
      } as Partial<Clip>);
    });

    act(() => {
      result.current.resetClips();
    });

    expect(result.current.clips).toHaveLength(0);
    expect(result.current.clipStart).toBeNull();
    expect(result.current.error).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/out');
    expect(revokeObjectURL).toHaveBeenCalledWith(
      'blob:http://localhost/thumb2'
    );
    revokeObjectURL.mockRestore();
  });

  it('saves clips to localStorage when clips change', () => {
    const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60, videoFile)
    );

    act(() => {
      result.current.handleMarkStart();
    });
    currentTime = 15;
    rerender();
    act(() => {
      result.current.handleMarkEnd();
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      `vce_clips_test.mp4_${videoFile.size}`,
      expect.stringContaining('"label":"Clip 1"')
    );

    setItemSpy.mockRestore();
  });

  it('restores clips from localStorage when videoFile is set', () => {
    const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
    const key = `vce_clips_test.mp4_${videoFile.size}`;
    const stored = JSON.stringify([
      { id: 'r1', label: 'Restored', startTime: 2, endTime: 8 },
    ]);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((k: string) =>
      k === key ? stored : null
    );

    const { result } = renderHook(() => useClipManager(0, 60, videoFile));

    expect(result.current.clips).toHaveLength(1);
    expect(result.current.clips[0].label).toBe('Restored');
    expect(result.current.clips[0].status).toBe('pending');

    vi.restoreAllMocks();
  });

  it('resetClips clears localStorage', () => {
    const videoFile = new File(['data'], 'test.mp4', { type: 'video/mp4' });
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    let currentTime = 5;
    const { result, rerender } = renderHook(() =>
      useClipManager(currentTime, 60, videoFile)
    );

    act(() => {
      result.current.handleMarkStart();
    });
    currentTime = 15;
    rerender();
    act(() => {
      result.current.handleMarkEnd();
    });

    act(() => {
      result.current.resetClips();
    });

    expect(removeItemSpy).toHaveBeenCalledWith(
      `vce_clips_test.mp4_${videoFile.size}`
    );

    removeItemSpy.mockRestore();
  });

  it('handleGenerateThumbnail does nothing without ffmpeg', async () => {
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
    await act(async () => {
      await result.current.handleGenerateThumbnail(clipId);
    });
    // Should not throw, thumbnailUrl should remain undefined
    expect(result.current.clips[0].thumbnailUrl).toBeUndefined();
  });

  it('handleSetThumbnailFromVideo does nothing without videoRef', () => {
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
      result.current.handleSetThumbnailFromVideo(clipId);
    });
    // Should not throw
    expect(result.current.clips[0].thumbnailUrl).toBeUndefined();
  });

  it('does not save to localStorage when no videoFile', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

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

    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it('handleDownloadZip does nothing with no done clips', async () => {
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

    // Should not throw — all clips are pending
    await act(async () => {
      await result.current.handleDownloadZip();
    });
  });
});
