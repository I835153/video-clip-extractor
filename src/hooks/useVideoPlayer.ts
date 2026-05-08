import { useState, useEffect, useCallback, RefObject } from 'react';

export function useVideoPlayer(
  videoRef: RefObject<HTMLVideoElement | null>,
  src?: string
) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleTimeUpdate() {
      setCurrentTime(video!.currentTime);
    }

    function handleLoadedMetadata() {
      setDuration(video!.duration);
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    if (video.readyState >= 1) {
      setDuration(video.duration);
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef, src]);

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
      setCurrentTime(video.currentTime);
    },
    [videoRef]
  );

  const stepForward = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      seek(video.currentTime + seconds);
    },
    [videoRef, seek]
  );

  const stepBackward = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      seek(video.currentTime - seconds);
    },
    [videoRef, seek]
  );

  return { currentTime, duration, isPlaying, seek, stepForward, stepBackward };
}
