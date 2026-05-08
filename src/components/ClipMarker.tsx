import { formatTime } from '../utils/formatTime';
import './ClipMarker.css';

interface ClipMarkerProps {
  currentTime: number;
  duration: number;
  onMarkStart: () => void;
  onMarkEnd: () => void;
  onStep: (seconds: number) => void;
  clipStart: number | null;
}

export default function ClipMarker({
  currentTime,
  onMarkStart,
  onMarkEnd,
  onStep,
  clipStart,
}: ClipMarkerProps) {
  return (
    <div className="clip-marker">
      <div className="clip-marker__time">{formatTime(currentTime)}</div>
      <div className="clip-marker__steps">
        <button onClick={() => onStep(-1 / 30)} title="Back 1 frame">
          |◀
        </button>
        <button onClick={() => onStep(-1)}>−1s</button>
        <button onClick={() => onStep(-0.1)}>−0.1s</button>
        <button onClick={() => onStep(0.1)}>+0.1s</button>
        <button onClick={() => onStep(1)}>+1s</button>
        <button onClick={() => onStep(1 / 30)} title="Forward 1 frame">
          ▶|
        </button>
      </div>
      <div className="clip-marker__marks">
        <button onClick={onMarkStart}>Mark Start</button>
        <button onClick={onMarkEnd} disabled={clipStart === null}>
          Mark End
        </button>
      </div>
      {clipStart !== null && (
        <p className="clip-marker__status">
          Start: {formatTime(clipStart)} → Mark end point to create clip
        </p>
      )}
    </div>
  );
}
