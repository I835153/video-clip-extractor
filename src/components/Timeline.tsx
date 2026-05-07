import { useRef } from 'react';
import { Clip } from '../types/clip';
import './Timeline.css';

interface TimelineProps {
  duration: number;
  currentTime: number;
  clips: Clip[];
  onSeek: (time: number) => void;
}

const CLIP_COLORS = [
  'rgba(33, 150, 243, 0.3)',
  'rgba(76, 175, 80, 0.3)',
  'rgba(255, 152, 0, 0.3)',
  'rgba(156, 39, 176, 0.3)',
  'rgba(244, 67, 54, 0.3)',
  'rgba(0, 188, 212, 0.3)',
];

export default function Timeline({
  duration,
  currentTime,
  clips,
  onSeek,
}: TimelineProps) {
  const barRef = useRef<HTMLDivElement>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = barRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = (clickX / rect.width) * duration;
    onSeek(Math.max(0, Math.min(time, duration)));
  }

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="timeline" ref={barRef} onClick={handleClick}>
      {clips.map((clip, index) => {
        const left = (clip.startTime / duration) * 100;
        const width = ((clip.endTime - clip.startTime) / duration) * 100;
        return (
          <div
            key={clip.id}
            className="timeline__clip"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              backgroundColor: CLIP_COLORS[index % CLIP_COLORS.length],
            }}
          >
            <span className="timeline__clip-label">{clip.label}</span>
          </div>
        );
      })}
      <div
        className="timeline__playhead"
        style={{ left: `${playheadPosition}%` }}
      />
    </div>
  );
}
