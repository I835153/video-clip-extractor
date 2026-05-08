import { render, screen, fireEvent } from '@testing-library/react';
import VideoPlayer from './VideoPlayer';
import { VideoInfo } from '../types/clip';

const mockVideo: VideoInfo = {
  file: new File(['content'], 'demo.mp4', { type: 'video/mp4' }),
  name: 'demo.mp4',
  size: 25 * 1024 * 1024, // 25 MB
  duration: 120,
  objectUrl: 'blob:http://localhost/test-url',
};

describe('VideoPlayer', () => {
  it('renders a video element', () => {
    const ref = { current: null };
    render(
      <VideoPlayer
        video={mockVideo}
        playerRef={ref}
        currentTime={0}
        duration={120}
      />
    );
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.src).toContain('blob:');
  });

  it('displays the video filename', () => {
    const ref = { current: null };
    render(
      <VideoPlayer
        video={mockVideo}
        playerRef={ref}
        currentTime={0}
        duration={120}
      />
    );
    expect(screen.getByText('demo.mp4')).toBeInTheDocument();
  });

  it('displays the formatted file size', () => {
    const ref = { current: null };
    render(
      <VideoPlayer
        video={mockVideo}
        playerRef={ref}
        currentTime={0}
        duration={120}
      />
    );
    expect(screen.getByText('25.0 MB')).toBeInTheDocument();
  });

  it('shows error message on video error', () => {
    const ref = { current: null };
    render(
      <VideoPlayer
        video={mockVideo}
        playerRef={ref}
        currentTime={0}
        duration={120}
      />
    );
    const video = document.querySelector('video') as HTMLVideoElement;
    fireEvent.error(video);
    expect(
      screen.getByText(/not supported by your browser/i)
    ).toBeInTheDocument();
  });
});
