import { render, screen, fireEvent } from '@testing-library/react';
import ClipMarker from './ClipMarker';

describe('ClipMarker', () => {
  const defaultProps = {
    currentTime: 65.3,
    duration: 120,
    onMarkStart: vi.fn(),
    onMarkEnd: vi.fn(),
    onStep: vi.fn(),
    clipStart: null as number | null,
  };

  it('renders current time display', () => {
    render(<ClipMarker {...defaultProps} />);
    expect(screen.getByText('01:05.3')).toBeInTheDocument();
  });

  it('Mark Start button calls onMarkStart', () => {
    const onMarkStart = vi.fn();
    render(<ClipMarker {...defaultProps} onMarkStart={onMarkStart} />);
    fireEvent.click(screen.getByText('Mark Start'));
    expect(onMarkStart).toHaveBeenCalledTimes(1);
  });

  it('Mark End button is disabled when clipStart is null', () => {
    render(<ClipMarker {...defaultProps} clipStart={null} />);
    expect(screen.getByText('Mark End')).toBeDisabled();
  });

  it('Mark End button is enabled when clipStart has a value', () => {
    render(<ClipMarker {...defaultProps} clipStart={10} />);
    expect(screen.getByText('Mark End')).toBeEnabled();
  });

  it('time-step buttons call onStep with correct values', () => {
    const onStep = vi.fn();
    render(<ClipMarker {...defaultProps} onStep={onStep} />);

    fireEvent.click(screen.getByText('−1s'));
    expect(onStep).toHaveBeenCalledWith(-1);

    fireEvent.click(screen.getByText('−0.1s'));
    expect(onStep).toHaveBeenCalledWith(-0.1);

    fireEvent.click(screen.getByText('+0.1s'));
    expect(onStep).toHaveBeenCalledWith(0.1);

    fireEvent.click(screen.getByText('+1s'));
    expect(onStep).toHaveBeenCalledWith(1);
  });

  it('frame step buttons call onStep with 1/30', () => {
    const onStep = vi.fn();
    render(<ClipMarker {...defaultProps} onStep={onStep} />);

    fireEvent.click(screen.getByText('|◀'));
    expect(onStep).toHaveBeenLastCalledWith(expect.closeTo(-1 / 30, 10));

    fireEvent.click(screen.getByText('▶|'));
    expect(onStep).toHaveBeenLastCalledWith(expect.closeTo(1 / 30, 10));
  });
});
