import { useRef, useState, useEffect } from 'react';
import './App.css';
import { VideoInfo } from './types/clip';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import ClipMarker from './components/ClipMarker';
import ClipList from './components/ClipList';
import ExportPanel from './components/ExportPanel';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { useClipManager } from './hooks/useClipManager';
import { useFFmpeg } from './hooks/useFFmpeg';

function App() {
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const browserSupported = typeof SharedArrayBuffer !== 'undefined';
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpeg = useFFmpeg();
  const { currentTime, duration, seek } = useVideoPlayer(
    videoRef,
    video?.objectUrl
  );
  const {
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
    handleSetThumbnailFromVideo,
    resetClips,
    handleDownloadZip,
  } = useClipManager(currentTime, duration, video?.file, videoRef, ffmpeg);

  function handleStep(seconds: number) {
    seek(videoRef.current!.currentTime + seconds);
  }

  function handleSeek(time: number) {
    seek(time);
  }

  function handleLoadNewVideo() {
    if (video) {
      URL.revokeObjectURL(video.objectUrl);
    }
    resetClips();
    setVideo(null);
  }

  useEffect(() => {
    if (!video) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'i':
        case 'I':
          handleMarkStart();
          break;
        case 'o':
        case 'O':
          handleMarkEnd();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleStep(e.shiftKey ? -0.1 : -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleStep(e.shiftKey ? 0.1 : 1);
          break;
        case ',':
          e.preventDefault();
          handleStep(-1 / 30);
          break;
        case '.':
          e.preventDefault();
          handleStep(1 / 30);
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="app">
      <div className="app__header">
        <h1>Video Clip Extractor</h1>
        {video && (
          <button className="app__load-new-btn" onClick={handleLoadNewVideo}>
            Load Different Video
          </button>
        )}
      </div>
      {!browserSupported ? (
        <p className="app__unsupported">
          Your browser does not support the required features for video
          processing. Please use Chrome or Edge (version 92+) to use this tool.
        </p>
      ) : !video ? (
        <VideoUploader onVideoSelected={setVideo} />
      ) : (
        <>
          <VideoPlayer
            video={video}
            playerRef={videoRef}
            currentTime={currentTime}
            duration={duration}
          />
          <Timeline
            duration={duration}
            currentTime={currentTime}
            clips={clips}
            onSeek={handleSeek}
          />
          <ClipMarker
            currentTime={currentTime}
            duration={duration}
            onMarkStart={handleMarkStart}
            onMarkEnd={handleMarkEnd}
            onStep={handleStep}
            clipStart={clipStart}
          />
          <p className="app__shortcuts">
            Shortcuts: <kbd>I</kbd> Mark Start · <kbd>O</kbd> Mark End ·{' '}
            <kbd>←</kbd>/<kbd>→</kbd> ±1s · <kbd>Shift</kbd>+<kbd>←</kbd>/
            <kbd>→</kbd> ±0.1s · <kbd>,</kbd>/<kbd>.</kbd> ±1 frame
          </p>
          {error && <p className="app__error">{error}</p>}
          <ExportPanel
            clips={clips}
            ffmpegLoaded={ffmpeg.loaded}
            ffmpegLoading={ffmpeg.loading}
            onExportAll={handleExportAll}
            onLoadFFmpeg={ffmpeg.load}
            onDownloadZip={handleDownloadZip}
          />
          <ClipList
            clips={clips}
            overlappingClipIds={overlappingClipIds}
            onUpdateClip={handleUpdateClip}
            onDeleteClip={handleDeleteClip}
            onExportClip={handleExportClip}
            onPreviewClip={handlePreviewClip}
            onSetThumbnail={handleSetThumbnailFromVideo}
          />
        </>
      )}
    </div>
  );
}

export default App;
