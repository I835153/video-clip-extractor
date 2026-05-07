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
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
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
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/only mp4 files are supported/i)).toBeInTheDocument();
  });
});
