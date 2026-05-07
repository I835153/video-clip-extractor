import { useState } from 'react';
import { VideoInfo } from '../types/clip';
import './VideoPlayer.css';

interface VideoPlayerProps {
  video: VideoInfo;
  playerRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({
  video,
  playerRef,
  currentTime,
  duration,
}: VideoPlayerProps) {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="video-player">
      <video
        ref={playerRef}
        src={video.objectUrl}
        controls
        className="video-player__video"
        onError={() => setVideoError(true)}
      />
      {videoError && (
        <p className="video-player__error">
          This video format is not supported by your browser. Please use an MP4
          file with H.264 video.
        </p>
      )}
      <div className="video-player__info">
        <span>{video.name}</span>
        <span>{formatFileSize(video.size)}</span>
        <span>
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
}
