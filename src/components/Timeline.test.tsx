import { render, screen, fireEvent } from '@testing-library/react';
import Timeline from './Timeline';
import { Clip } from '../types/clip';

const mockClips: Clip[] = [
  {
    id: 'clip-1',
    label: 'Clip 1',
    startTime: 10,
    endTime: 20,
    status: 'pending',
  },
];

describe('Timeline', () => {
  it('renders the timeline bar', () => {
    render(
      <Timeline duration={60} currentTime={0} clips={[]} onSeek={vi.fn()} />
    );
    const timeline = document.querySelector('.timeline');
    expect(timeline).toBeInTheDocument();
  });

  it('renders clip range overlays for each clip', () => {
    render(
      <Timeline
        duration={60}
        currentTime={0}
        clips={mockClips}
        onSeek={vi.fn()}
      />
    );
    expect(screen.getByText('Clip 1')).toBeInTheDocument();
  });

  it('calls onSeek when timeline is clicked', () => {
    const onSeek = vi.fn();
    render(
      <Timeline duration={60} currentTime={0} clips={[]} onSeek={onSeek} />
    );
    const timeline = document.querySelector('.timeline') as HTMLElement;

    // Mock getBoundingClientRect
    Object.defineProperty(timeline, 'getBoundingClientRect', {
      value: () => ({ left: 0, width: 600, top: 0, height: 40 }),
    });

    fireEvent.click(timeline, { clientX: 300 });
    expect(onSeek).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledWith(30); // 300/600 * 60 = 30
  });

  it('does not call onSeek when duration is 0', () => {
    const onSeek = vi.fn();
    render(
      <Timeline duration={0} currentTime={0} clips={[]} onSeek={onSeek} />
    );
    const timeline = document.querySelector('.timeline') as HTMLElement;

    Object.defineProperty(timeline, 'getBoundingClientRect', {
      value: () => ({ left: 0, width: 600, top: 0, height: 40 }),
    });

    fireEvent.click(timeline, { clientX: 300 });
    expect(onSeek).not.toHaveBeenCalled();
  });
});
