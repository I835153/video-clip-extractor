import { useState, useCallback } from 'react';
import { Clip } from '../types/clip';
import { validateClip } from '../utils/validateClip';

export function useClipManager(currentTime: number, duration: number) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [clipStart, setClipStart] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleExportClip = useCallback((id: string) => {
    console.log('Export clip', id);
  }, []);

  const handlePreviewClip = useCallback((id: string) => {
    console.log('Preview clip', id);
  }, []);

  return {
    clips,
    clipStart,
    error,
    handleMarkStart,
    handleMarkEnd,
    handleUpdateClip,
    handleDeleteClip,
    handleExportClip,
    handlePreviewClip,
  };
}
