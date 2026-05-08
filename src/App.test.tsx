import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock hooks to test App logic in isolation
const mockHandleMarkStart = vi.fn();
const mockHandleMarkEnd = vi.fn();
const mockSeek = vi.fn();

vi.mock('./hooks/useVideoPlayer', () => ({
  useVideoPlayer: () => ({
    currentTime: 10,
    duration: 60,
    isPlaying: false,
    seek: mockSeek,
  }),
}));

vi.mock('./hooks/useClipManager', () => ({
  useClipManager: () => ({
    clips: [],
    clipStart: null,
    error: null,
    overlappingClipIds: new Set(),
    handleMarkStart: mockHandleMarkStart,
    handleMarkEnd: mockHandleMarkEnd,
    handleUpdateClip: vi.fn(),
    handleDeleteClip: vi.fn(),
    handleExportClip: vi.fn(),
    handleExportAll: vi.fn(),
    handlePreviewClip: vi.fn(),
  }),
}));

vi.mock('./hooks/useFFmpeg', () => ({
  useFFmpeg: () => ({
    loaded: false,
    loading: false,
    load: vi.fn(),
    trim: vi.fn(),
    cleanup: vi.fn(),
  }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app heading', () => {
    render(<App />);
    expect(screen.getByText('Video Clip Extractor')).toBeInTheDocument();
  });

  it('shows upload zone when no video is loaded', () => {
    render(<App />);
    expect(screen.getByText(/drag .* drop an mp4 file/i)).toBeInTheDocument();
  });

  it('shows video player after file upload', () => {
    render(<App />);

    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Shortcuts:/)).toBeInTheDocument();
  });

  it('keyboard "i" calls handleMarkStart when video loaded', () => {
    render(<App />);

    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.keyDown(document, { key: 'i' });
    expect(mockHandleMarkStart).toHaveBeenCalled();
  });

  it('keyboard "o" calls handleMarkEnd when video loaded', () => {
    render(<App />);

    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.keyDown(document, { key: 'o' });
    expect(mockHandleMarkEnd).toHaveBeenCalled();
  });

  it('keyboard ArrowLeft calls seek', () => {
    render(<App />);

    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(mockSeek).toHaveBeenCalled();
  });

  it('keyboard ArrowRight calls seek', () => {
    render(<App />);

    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(mockSeek).toHaveBeenCalled();
  });

  it('keyboard shortcuts not attached when no video', () => {
    render(<App />);
    fireEvent.keyDown(document, { key: 'i' });
    expect(mockHandleMarkStart).not.toHaveBeenCalled();
  });
});
