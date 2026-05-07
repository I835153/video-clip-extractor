import { useRef, useState } from 'react';
import './App.css';
import { VideoInfo } from './types/clip';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import ClipMarker from './components/ClipMarker';
import ClipList from './components/ClipList';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { useClipManager } from './hooks/useClipManager';

function App() {
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentTime, duration, seek } = useVideoPlayer(
    videoRef,
    video?.objectUrl
  );
  const {
    clips,
    clipStart,
    error,
    handleMarkStart,
    handleMarkEnd,
    handleUpdateClip,
    handleDeleteClip,
    handleExportClip,
    handlePreviewClip,
  } = useClipManager(currentTime, duration);

  function handleStep(seconds: number) {
    seek(videoRef.current!.currentTime + seconds);
  }

  function handleSeek(time: number) {
    seek(time);
  }

  return (
    <div className="app">
      <h1>Video Clip Extractor</h1>
      {!video ? (
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
          {error && <p className="app__error">{error}</p>}
          <ClipList
            clips={clips}
            onUpdateClip={handleUpdateClip}
            onDeleteClip={handleDeleteClip}
            onExportClip={handleExportClip}
            onPreviewClip={handlePreviewClip}
          />
        </>
      )}
    </div>
  );
}

export default App;
