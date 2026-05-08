import { render, screen, fireEvent } from '@testing-library/react';
import VideoUploader from './VideoUploader';

describe('VideoUploader', () => {
  it('renders the drop zone with correct text', () => {
    render(<VideoUploader onVideoSelected={vi.fn()} />);
    expect(
      screen.getByText(/drag & drop an mp4 file here/i)
    ).toBeInTheDocument();
  });

  it('the drop zone exists and is visible', () => {
    render(<VideoUploader onVideoSelected={vi.fn()} />);
    const dropZone = screen.getByRole('button');
    expect(dropZone).toBeVisible();
  });

  it('calls onVideoSelected when a valid .mp4 file is selected', () => {
    const onVideoSelected = vi.fn();
    render(<VideoUploader onVideoSelected={onVideoSelected} />);

    const file = new File(['video-content'], 'test.mp4', {
      type: 'video/mp4',
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(onVideoSelected).toHaveBeenCalledTimes(1);
    expect(onVideoSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test.mp4',
        file,
      })
    );
  });

  it('shows an error message when a non-MP4 file is selected', () => {
    render(<VideoUploader onVideoSelected={vi.fn()} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      screen.getByText(/only mp4 files are supported/i)
    ).toBeInTheDocument();
  });

  it('shows a size warning for files over 300MB', () => {
    render(<VideoUploader onVideoSelected={vi.fn()} />);

    const bigFile = new File(['x'], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(bigFile, 'size', { value: 400 * 1024 * 1024 });

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(screen.getByText(/over 300MB/i)).toBeInTheDocument();
  });

  it('accepts dropped MP4 file', () => {
    const onVideoSelected = vi.fn();
    render(<VideoUploader onVideoSelected={onVideoSelected} />);

    const file = new File(['video'], 'dropped.mp4', { type: 'video/mp4' });
    const dropZone = screen.getByRole('button');

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onVideoSelected).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'dropped.mp4' })
    );
  });

  it('handles drag over and drag leave', () => {
    render(<VideoUploader onVideoSelected={vi.fn()} />);
    const dropZone = screen.getByRole('button');

    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass('upload-zone--dragging');

    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('upload-zone--dragging');
  });

  it('opens file picker on Enter key press', () => {
    render(<VideoUploader onVideoSelected={vi.fn()} />);
    const dropZone = screen.getByRole('button');
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.keyDown(dropZone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('opens file picker on Space key press', () => {
    render(<VideoUploader onVideoSelected={vi.fn()} />);
    const dropZone = screen.getByRole('button');
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.keyDown(dropZone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('clears size warning for normal-sized file', () => {
    const onVideoSelected = vi.fn();
    render(<VideoUploader onVideoSelected={onVideoSelected} />);

    // First upload a large file
    const bigFile = new File(['x'], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(bigFile, 'size', { value: 400 * 1024 * 1024 });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(screen.getByText(/over 300MB/i)).toBeInTheDocument();

    // Then upload a normal file
    const normalFile = new File(['x'], 'normal.mp4', { type: 'video/mp4' });
    Object.defineProperty(normalFile, 'size', { value: 50 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [normalFile] } });
    expect(screen.queryByText(/over 300MB/i)).not.toBeInTheDocument();
  });
});
