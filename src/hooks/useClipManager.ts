import { useState, useCallback, useRef } from 'react';
import { Clip } from '../types/clip';
import { validateClip } from '../utils/validateClip';

interface FFmpegHandle {
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  trim: (
    file: File,
    startTime: number,
    endTime: number,
    sourceWritten?: boolean,
  ) => Promise<Blob>;
  cleanup: () => Promise<void>;
}

export function useClipManager(
  currentTime: number,
  duration: number,
  videoFile?: File | null,
  videoRef?: React.RefObject<HTMLVideoElement | null>,
  ffmpeg?: FFmpegHandle,
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
  }, [clipStart, currentTime, duration, clips.length]);

  const handleUpdateClip = useCallback(
    (id: string, updates: Partial<Clip>) => {
      setClips((prev) =>
        prev.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip))
      );
    },
    []
  );

  const handleDeleteClip = useCallback((id: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip?.outputUrl) {
        URL.revokeObjectURL(clip.outputUrl);
      }
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const handleExportClip = useCallback(
    async (id: string) => {
      if (!videoFile || !ffmpeg) return;

      setClips((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'exporting' as const } : c)),
      );

      try {
        if (!ffmpeg.loaded) await ffmpeg.load();

        const clip = clips.find((c) => c.id === id);
        if (!clip) return;

        const blob = await ffmpeg.trim(videoFile, clip.startTime, clip.endTime);
        const outputUrl = URL.createObjectURL(blob);

        setClips((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, status: 'done' as const, outputUrl } : c,
          ),
        );
      } catch (err) {
        setClips((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'error' as const,
                  error: err instanceof Error ? err.message : 'Export failed',
                }
              : c,
          ),
        );
      }
    },
    [videoFile, ffmpeg, clips],
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
            c.id === clip.id ? { ...c, status: 'exporting' as const } : c,
          ),
        );

        try {
          const blob = await ffmpeg.trim(
            videoFile,
            clip.startTime,
            clip.endTime,
            i > 0,
          );
          const outputUrl = URL.createObjectURL(blob);
          setClips((prev) =>
            prev.map((c) =>
              c.id === clip.id
                ? { ...c, status: 'done' as const, outputUrl }
                : c,
            ),
          );
        } catch (err) {
          setClips((prev) =>
            prev.map((c) =>
              c.id === clip.id
                ? {
                    ...c,
                    status: 'error' as const,
                    error:
                      err instanceof Error ? err.message : 'Export failed',
                  }
                : c,
            ),
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
    [clips, videoRef],
  );

  return {
    clips,
    clipStart,
    error,
    handleMarkStart,
    handleMarkEnd,
    handleUpdateClip,
    handleDeleteClip,
    handleExportClip,
    handleExportAll,
    handlePreviewClip,
  };
}
