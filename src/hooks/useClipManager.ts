import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { Clip } from '../types/clip';
import { validateClip, findOverlaps } from '../utils/validateClip';

function getStorageKey(file: File): string {
  return `vce_clips_${file.name}_${file.size}`;
}

interface FFmpegHandle {
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  trim: (
    file: File,
    startTime: number,
    endTime: number,
    sourceWritten?: boolean
  ) => Promise<Blob>;
  cleanup: () => Promise<void>;
  extractFrame: (
    file: File,
    time: number,
    sourceWritten?: boolean
  ) => Promise<Blob>;
  setProgressCallback: (callback: ((ratio: number) => void) | null) => void;
}

export function useClipManager(
  currentTime: number,
  duration: number,
  videoFile?: File | null,
  videoRef?: React.RefObject<HTMLVideoElement | null>,
  ffmpeg?: FFmpegHandle
) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [clipStart, setClipStart] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRafRef = useRef<number | null>(null);

  const handleMarkStart = useCallback(() => {
    setError(null);
    setClipStart(currentTime);
  }, [currentTime]);

  const handleMarkEnd = useCallback(() => {
    if (clipStart === null) return;

    const result = validateClip(clipStart, currentTime, duration);
    if (!result.valid) {
      setError(result.error ?? 'Invalid clip');
      return;
    }

    const newClip: Clip = {
      id: crypto.randomUUID(),
      label: `Clip ${clips.length + 1}`,
      startTime: clipStart,
      endTime: currentTime,
      status: 'pending',
    };

    setClips((prev) => [...prev, newClip]);
    setClipStart(null);
    setError(null);

    if (ffmpeg && ffmpeg.loaded && videoFile) {
      const midpoint = (newClip.startTime + newClip.endTime) / 2;
      ffmpeg
        .extractFrame(videoFile, midpoint)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setClips((prev) =>
            prev.map((c) =>
              c.id === newClip.id ? { ...c, thumbnailUrl: url } : c
            )
          );
        })
        .catch((err) => console.warn('Thumbnail generation failed:', err));
    }
  }, [clipStart, currentTime, duration, clips.length, ffmpeg, videoFile]);

  const handleUpdateClip = useCallback((id: string, updates: Partial<Clip>) => {
    setClips((prev) =>
      prev.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip))
    );
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip?.outputUrl) {
        URL.revokeObjectURL(clip.outputUrl);
      }
      if (clip?.thumbnailUrl) {
        URL.revokeObjectURL(clip.thumbnailUrl);
      }
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const handleExportClip = useCallback(
    async (id: string) => {
      if (!videoFile || !ffmpeg) return;

      setClips((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: 'exporting' as const } : c
        )
      );

      try {
        if (!ffmpeg.loaded) await ffmpeg.load();

        const clip = clips.find((c) => c.id === id);
        if (!clip) return;

        ffmpeg.setProgressCallback((ratio) => {
          setClips((prev) =>
            prev.map((c) => (c.id === id ? { ...c, progress: ratio } : c))
          );
        });

        const blob = await ffmpeg.trim(videoFile, clip.startTime, clip.endTime);
        ffmpeg.setProgressCallback(null);
        const outputUrl = URL.createObjectURL(blob);

        setClips((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'done' as const,
                  outputUrl,
                  progress: undefined,
                }
              : c
          )
        );
      } catch (err) {
        ffmpeg.setProgressCallback(null);
        setClips((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'error' as const,
                  error: err instanceof Error ? err.message : 'Export failed',
                  progress: undefined,
                }
              : c
          )
        );
      }
    },
    [videoFile, ffmpeg, clips]
  );

  const handleExportAll = useCallback(async () => {
    if (!videoFile || !ffmpeg) return;

    try {
      if (!ffmpeg.loaded) await ffmpeg.load();

      const pendingClips = clips.filter((c) => c.status === 'pending');
      for (let i = 0; i < pendingClips.length; i++) {
        const clip = pendingClips[i];

        setClips((prev) =>
          prev.map((c) =>
            c.id === clip.id ? { ...c, status: 'exporting' as const } : c
          )
        );

        try {
          ffmpeg.setProgressCallback((ratio) => {
            setClips((prev) =>
              prev.map((c) =>
                c.id === clip.id ? { ...c, progress: ratio } : c
              )
            );
          });

          const blob = await ffmpeg.trim(
            videoFile,
            clip.startTime,
            clip.endTime,
            i > 0
          );
          ffmpeg.setProgressCallback(null);
          const outputUrl = URL.createObjectURL(blob);
          setClips((prev) =>
            prev.map((c) =>
              c.id === clip.id
                ? {
                    ...c,
                    status: 'done' as const,
                    outputUrl,
                    progress: undefined,
                  }
                : c
            )
          );
        } catch (err) {
          ffmpeg.setProgressCallback(null);
          setClips((prev) =>
            prev.map((c) =>
              c.id === clip.id
                ? {
                    ...c,
                    status: 'error' as const,
                    error: err instanceof Error ? err.message : 'Export failed',
                    progress: undefined,
                  }
                : c
            )
          );
        }
      }

      await ffmpeg.cleanup();
    } catch (err) {
      console.error('Export all failed:', err);
    }
  }, [videoFile, ffmpeg, clips]);

  const handlePreviewClip = useCallback(
    (id: string) => {
      if (!videoRef?.current) return;

      // Cancel any existing preview
      if (previewRafRef.current !== null) {
        cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }

      const clip = clips.find((c) => c.id === id);
      if (!clip) return;

      const video = videoRef.current;
      video.currentTime = clip.startTime;
      video.play();

      function checkEnd() {
        if (video.currentTime >= clip!.endTime) {
          video.pause();
          previewRafRef.current = null;
          return;
        }
        previewRafRef.current = requestAnimationFrame(checkEnd);
      }

      previewRafRef.current = requestAnimationFrame(checkEnd);
    },
    [clips, videoRef]
  );

  const overlappingClipIds = useMemo(() => {
    const pairs = findOverlaps(clips);
    const ids = new Set<string>();
    for (const [a, b] of pairs) {
      ids.add(a);
      ids.add(b);
    }
    return ids;
  }, [clips]);

  const handleGenerateThumbnail = useCallback(
    async (clipId: string) => {
      if (!ffmpeg || !ffmpeg.loaded || !videoFile) return;

      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return;

      const midpoint = (clip.startTime + clip.endTime) / 2;

      try {
        const blob = await ffmpeg.extractFrame(videoFile, midpoint);
        const url = URL.createObjectURL(blob);
        setClips((prev) =>
          prev.map((c) => {
            if (c.id !== clipId) return c;
            if (c.thumbnailUrl) URL.revokeObjectURL(c.thumbnailUrl);
            return { ...c, thumbnailUrl: url };
          })
        );
      } catch (err) {
        console.warn('Thumbnail generation failed:', err);
      }
    },
    [ffmpeg, videoFile, clips]
  );

  const handleSetThumbnailFromVideo = useCallback(
    (clipId: string) => {
      if (!videoRef?.current) return;

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          setClips((prev) =>
            prev.map((c) => {
              if (c.id !== clipId) return c;
              if (c.thumbnailUrl) URL.revokeObjectURL(c.thumbnailUrl);
              return { ...c, thumbnailUrl: url };
            })
          );
        },
        'image/jpeg',
        0.85
      );
    },
    [videoRef]
  );

  const resetClips = useCallback(() => {
    clips.forEach((clip) => {
      if (clip.outputUrl) URL.revokeObjectURL(clip.outputUrl);
      if (clip.thumbnailUrl) URL.revokeObjectURL(clip.thumbnailUrl);
    });
    if (videoFile) {
      localStorage.removeItem(getStorageKey(videoFile));
    }
    setClips([]);
    setClipStart(null);
    setError(null);
  }, [clips, videoFile]);

  // Save clips to localStorage when they change
  useEffect(() => {
    if (!videoFile || clips.length === 0) return;
    try {
      const serializable = clips.map(({ id, label, startTime, endTime }) => ({
        id,
        label,
        startTime,
        endTime,
      }));
      localStorage.setItem(
        getStorageKey(videoFile),
        JSON.stringify(serializable)
      );
    } catch {
      // localStorage may be full — ignore
    }
  }, [clips, videoFile]);

  // Restore clips from localStorage when videoFile changes
  useEffect(() => {
    if (!videoFile) return;
    try {
      const stored = localStorage.getItem(getStorageKey(videoFile));
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const restored: Clip[] = parsed.map(
          (c: {
            id: string;
            label: string;
            startTime: number;
            endTime: number;
          }) => ({
            id: c.id,
            label: c.label,
            startTime: c.startTime,
            endTime: c.endTime,
            status: 'pending' as const,
          })
        );
        setClips(restored);
      }
    } catch {
      // Invalid data — ignore
    }
  }, [videoFile]);

  const handleDownloadZip = useCallback(async () => {
    const doneClips = clips.filter((c) => c.status === 'done' && c.outputUrl);
    if (doneClips.length === 0) return;

    const zip = new JSZip();
    for (const clip of doneClips) {
      const response = await fetch(clip.outputUrl!);
      const blob = await response.blob();
      const filename = `clip_${clip.label.replace(/\s+/g, '_')}.mp4`;
      zip.file(filename, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clips.zip';
    a.click();
    URL.revokeObjectURL(url);
  }, [clips]);

  return {
    clips,
    clipStart,
    error,
    overlappingClipIds,
    handleMarkStart,
    handleMarkEnd,
    handleUpdateClip,
    handleDeleteClip,
    handleExportClip,
    handleExportAll,
    handlePreviewClip,
    handleGenerateThumbnail,
    handleSetThumbnailFromVideo,
    resetClips,
    handleDownloadZip,
  };
}
