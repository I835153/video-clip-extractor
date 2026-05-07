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
});
