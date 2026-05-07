import { render, screen } from '@testing-library/react';
import ExportPanel from './ExportPanel';

const baseProps = {
  clips: [],
  ffmpegLoaded: false,
  ffmpegLoading: false,
  onExportAll: vi.fn(),
  onLoadFFmpeg: vi.fn(),
};

describe('ExportPanel', () => {
  it('shows "Load FFmpeg Engine" button when not loaded', () => {
    render(<ExportPanel {...baseProps} />);
    expect(screen.getByText('Load FFmpeg Engine')).toBeInTheDocument();
  });

  it('shows loading message when ffmpegLoading is true', () => {
    render(<ExportPanel {...baseProps} ffmpegLoading={true} />);
    expect(screen.getByText('Loading FFmpeg engine…')).toBeInTheDocument();
  });

  it('shows "Export All Clips" button when loaded', () => {
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} />);
    expect(screen.getByText('Export All Clips')).toBeInTheDocument();
  });

  it('"Export All" button is disabled when no clips exist', () => {
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} clips={[]} />);
    expect(screen.getByText('Export All Clips')).toBeDisabled();
  });

  it('shows clip count when pending clips exist', () => {
    const clips = [
      {
        id: '1',
        label: 'Clip 1',
        startTime: 0,
        endTime: 5,
        status: 'pending' as const,
      },
      {
        id: '2',
        label: 'Clip 2',
        startTime: 10,
        endTime: 15,
        status: 'pending' as const,
      },
    ];
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} clips={clips} />);
    expect(screen.getByText('2 clips ready to export')).toBeInTheDocument();
  });
});
