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
  it('shows "Prepare Export Engine" button when not loaded', () => {
    render(<ExportPanel {...baseProps} />);
    expect(screen.getByText('Prepare Export Engine')).toBeInTheDocument();
  });

  it('shows loading message when ffmpegLoading is true', () => {
    render(<ExportPanel {...baseProps} ffmpegLoading={true} />);
    expect(screen.getByText('Preparing export engine…')).toBeInTheDocument();
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

  it('shows singular "clip" for 1 pending', () => {
    const clips = [
      {
        id: '1',
        label: 'C1',
        startTime: 0,
        endTime: 5,
        status: 'pending' as const,
      },
    ];
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} clips={clips} />);
    expect(screen.getByText('1 clip ready to export')).toBeInTheDocument();
  });

  it('shows done count in summary', () => {
    const clips = [
      {
        id: '1',
        label: 'C1',
        startTime: 0,
        endTime: 5,
        status: 'done' as const,
        outputUrl: 'blob:x',
      },
    ];
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} clips={clips} />);
    expect(screen.getByText('1 done')).toBeInTheDocument();
  });

  it('shows error count in summary', () => {
    const clips = [
      {
        id: '1',
        label: 'C1',
        startTime: 0,
        endTime: 5,
        status: 'error' as const,
        error: 'fail',
      },
    ];
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} clips={clips} />);
    expect(screen.getByText('1 error')).toBeInTheDocument();
  });

  it('shows both done and error in summary', () => {
    const clips = [
      {
        id: '1',
        label: 'C1',
        startTime: 0,
        endTime: 5,
        status: 'done' as const,
        outputUrl: 'blob:x',
      },
      {
        id: '2',
        label: 'C2',
        startTime: 10,
        endTime: 15,
        status: 'error' as const,
        error: 'fail',
      },
    ];
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} clips={clips} />);
    expect(screen.getByText(/1 done/)).toBeInTheDocument();
    expect(screen.getByText(/1 error/)).toBeInTheDocument();
  });

  it('disables Export All when clips are exporting', () => {
    const clips = [
      {
        id: '1',
        label: 'C1',
        startTime: 0,
        endTime: 5,
        status: 'exporting' as const,
      },
    ];
    render(<ExportPanel {...baseProps} ffmpegLoaded={true} clips={clips} />);
    expect(screen.getByText('Export All Clips')).toBeDisabled();
  });
});
