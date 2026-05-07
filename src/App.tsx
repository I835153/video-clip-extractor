import { useRef, useState } from 'react';
import './App.css';
import { VideoInfo } from './types/clip';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import { useVideoPlayer } from './hooks/useVideoPlayer';

function App() {
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentTime, duration } = useVideoPlayer(videoRef, video?.objectUrl);

  return (
    <div className="app">
      <h1>Video Clip Extractor</h1>
      {!video ? (
        <VideoUploader onVideoSelected={setVideo} />
      ) : (
        <VideoPlayer
          video={video}
          playerRef={videoRef}
          currentTime={currentTime}
          duration={duration}
        />
      )}
    </div>
  );
}

export default App;
