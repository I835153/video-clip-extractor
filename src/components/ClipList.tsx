import { useState } from 'react';
import { Clip } from '../types/clip';
import { formatTime, parseTime } from '../utils/formatTime';
import './ClipList.css';

interface ClipListProps {
  clips: Clip[];
  overlappingClipIds?: Set<string>;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onDeleteClip: (id: string) => void;
  onExportClip: (id: string) => void;
  onPreviewClip: (id: string) => void;
}

export default function ClipList({
  clips,
  overlappingClipIds,
  onUpdateClip,
  onDeleteClip,
  onExportClip,
  onPreviewClip,
}: ClipListProps) {
  if (clips.length === 0) {
    return (
      <p className="clip-list__empty">
        No clips defined yet. Mark start and end points on the video to create
        clips.
      </p>
    );
  }

  return (
    <div className="clip-list">
      <div className="clip-list__scroll">
        <table className="clip-list__table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clips.map((clip) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                isOverlapping={overlappingClipIds?.has(clip.id) ?? false}
                onUpdateClip={onUpdateClip}
                onDeleteClip={onDeleteClip}
                onExportClip={onExportClip}
                onPreviewClip={onPreviewClip}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ClipRowProps {
  clip: Clip;
  isOverlapping: boolean;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onDeleteClip: (id: string) => void;
  onExportClip: (id: string) => void;
  onPreviewClip: (id: string) => void;
}

function ClipRow({
  clip,
  isOverlapping,
  onUpdateClip,
  onDeleteClip,
  onExportClip,
  onPreviewClip,
}: ClipRowProps) {
  const [editStart, setEditStart] = useState(formatTime(clip.startTime));
  const [editEnd, setEditEnd] = useState(formatTime(clip.endTime));
  const [downloaded, setDownloaded] = useState(false);

  function handleStartBlur() {
    const parsed = parseTime(editStart);
    if (!isNaN(parsed)) {
      onUpdateClip(clip.id, { startTime: parsed });
    } else {
      setEditStart(formatTime(clip.startTime));
    }
  }

  function handleEndBlur() {
    const parsed = parseTime(editEnd);
    if (!isNaN(parsed)) {
      onUpdateClip(clip.id, { endTime: parsed });
    } else {
      setEditEnd(formatTime(clip.endTime));
    }
  }

  const duration = clip.endTime - clip.startTime;
  const filename = `clip_${clip.label.replace(/\s+/g, '_')}_${formatTime(clip.startTime).replace(':', '-')}-${formatTime(clip.endTime).replace(':', '-')}.mp4`;

  return (
    <tr>
      <td>
        <input
          type="text"
          value={clip.label}
          onChange={(e) => onUpdateClip(clip.id, { label: e.target.value })}
          className="clip-list__label-input"
        />
      </td>
      <td>
        <input
          type="text"
          value={editStart}
          onChange={(e) => setEditStart(e.target.value)}
          onBlur={handleStartBlur}
          className="clip-list__time-input"
        />
      </td>
      <td>
        <input
          type="text"
          value={editEnd}
          onChange={(e) => setEditEnd(e.target.value)}
          onBlur={handleEndBlur}
          className="clip-list__time-input"
        />
      </td>
      <td className="clip-list__duration">{formatTime(duration)}</td>
      <td>
        <span className={`clip-list__status clip-list__status--${clip.status}`}>
          {clip.status}
        </span>
        {isOverlapping && (
          <span
            className="clip-list__overlap-warning"
            title="This clip overlaps with another clip"
          >
            ⚠️
          </span>
        )}
      </td>
      <td className="clip-list__actions">
        <button onClick={() => onPreviewClip(clip.id)}>Preview</button>
        <button
          onClick={() => onExportClip(clip.id)}
          disabled={clip.status === 'exporting'}
        >
          Export
        </button>
        <button onClick={() => onDeleteClip(clip.id)}>Delete</button>
        {clip.status === 'done' && clip.outputUrl && (
          <a
            href={clip.outputUrl}
            download={filename}
            className={`clip-list__download ${downloaded ? 'clip-list__download--done' : ''}`}
            onClick={() => setDownloaded(true)}
          >
            {downloaded ? 'Re-download' : 'Download'}
          </a>
        )}
        {clip.status === 'error' && clip.error && (
          <span className="clip-list__error" title={clip.error}>
            ⚠
          </span>
        )}
      </td>
    </tr>
  );
}
