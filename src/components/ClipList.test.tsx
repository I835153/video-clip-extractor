import { render, screen, fireEvent } from '@testing-library/react';
import ClipList from './ClipList';
import { Clip } from '../types/clip';

const mockClips: Clip[] = [
  {
    id: 'clip-1',
    label: 'Clip 1',
    startTime: 5,
    endTime: 15,
    status: 'pending',
  },
  {
    id: 'clip-2',
    label: 'Clip 2',
    startTime: 30,
    endTime: 45,
    status: 'done',
    outputUrl: 'blob:http://localhost/test',
  },
];

const defaultProps = {
  clips: mockClips,
  onUpdateClip: vi.fn(),
  onDeleteClip: vi.fn(),
  onExportClip: vi.fn(),
  onPreviewClip: vi.fn(),
};

describe('ClipList', () => {
  it('shows empty message when no clips', () => {
    render(<ClipList {...defaultProps} clips={[]} />);
    expect(screen.getByText(/no clips defined/i)).toBeInTheDocument();
  });

  it('renders clip rows when clips are provided', () => {
    render(<ClipList {...defaultProps} />);
    expect(screen.getByDisplayValue('Clip 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Clip 2')).toBeInTheDocument();
  });

  it('delete button calls onDeleteClip with correct id', () => {
    const onDeleteClip = vi.fn();
    render(<ClipList {...defaultProps} onDeleteClip={onDeleteClip} />);
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteClip).toHaveBeenCalledWith('clip-1');
  });

  it('displays formatted start and end times', () => {
    render(<ClipList {...defaultProps} />);
    expect(screen.getByDisplayValue('00:05.0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('00:15.0')).toBeInTheDocument();
  });

  it('shows download link when clip status is done with outputUrl', () => {
    render(<ClipList {...defaultProps} />);
    const downloadLink = screen.getByText('Download');
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', 'blob:http://localhost/test');
  });

  it('export button calls onExportClip', () => {
    const onExportClip = vi.fn();
    render(<ClipList {...defaultProps} onExportClip={onExportClip} />);
    const exportButtons = screen.getAllByText('Export');
    fireEvent.click(exportButtons[0]);
    expect(onExportClip).toHaveBeenCalledWith('clip-1');
  });

  it('preview button calls onPreviewClip', () => {
    const onPreviewClip = vi.fn();
    render(<ClipList {...defaultProps} onPreviewClip={onPreviewClip} />);
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);
    expect(onPreviewClip).toHaveBeenCalledWith('clip-1');
  });

  it('label input calls onUpdateClip on change', () => {
    const onUpdateClip = vi.fn();
    render(<ClipList {...defaultProps} onUpdateClip={onUpdateClip} />);
    const labelInput = screen.getByDisplayValue('Clip 1');
    fireEvent.change(labelInput, { target: { value: 'New Label' } });
    expect(onUpdateClip).toHaveBeenCalledWith('clip-1', { label: 'New Label' });
  });

  it('time input updates on blur with valid time', () => {
    const onUpdateClip = vi.fn();
    render(<ClipList {...defaultProps} onUpdateClip={onUpdateClip} />);
    const startInput = screen.getByDisplayValue('00:05.0');
    fireEvent.change(startInput, { target: { value: '00:10.0' } });
    fireEvent.blur(startInput);
    expect(onUpdateClip).toHaveBeenCalledWith('clip-1', { startTime: 10 });
  });

  it('time input reverts on blur with invalid time', () => {
    const onUpdateClip = vi.fn();
    render(<ClipList {...defaultProps} onUpdateClip={onUpdateClip} />);
    const startInput = screen.getByDisplayValue('00:05.0');
    fireEvent.change(startInput, { target: { value: 'invalid' } });
    fireEvent.blur(startInput);
    expect(onUpdateClip).not.toHaveBeenCalled();
  });

  it('shows overlap warning when clip is in overlappingClipIds', () => {
    const overlapping = new Set(['clip-1']);
    render(<ClipList {...defaultProps} overlappingClipIds={overlapping} />);
    expect(
      screen.getByTitle('This clip overlaps with another clip')
    ).toBeInTheDocument();
  });

  it('shows error icon when clip has error status', () => {
    const errorClips: Clip[] = [
      {
        id: 'e1',
        label: 'Error Clip',
        startTime: 0,
        endTime: 5,
        status: 'error',
        error: 'Failed',
      },
    ];
    render(<ClipList {...defaultProps} clips={errorClips} />);
    expect(screen.getByTitle('Failed')).toBeInTheDocument();
  });

  it('download link changes to Re-download after click', () => {
    render(<ClipList {...defaultProps} />);
    const downloadLink = screen.getByText('Download');
    fireEvent.click(downloadLink);
    expect(screen.getByText('Re-download')).toBeInTheDocument();
  });
});
