import { Clip } from '../types/clip';
import './ExportPanel.css';

interface ExportPanelProps {
  clips: Clip[];
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  onExportAll: () => void;
  onLoadFFmpeg: () => void;
  onDownloadZip: () => void;
}

export default function ExportPanel({
  clips,
  ffmpegLoaded,
  ffmpegLoading,
  onExportAll,
  onLoadFFmpeg,
  onDownloadZip,
}: ExportPanelProps) {
  const pendingCount = clips.filter((c) => c.status === 'pending').length;
  const exportingCount = clips.filter((c) => c.status === 'exporting').length;
  const doneCount = clips.filter((c) => c.status === 'done').length;
  const errorCount = clips.filter((c) => c.status === 'error').length;

  if (!ffmpegLoaded && !ffmpegLoading) {
    return (
      <div className="export-panel">
        <button className="export-panel__load-btn" onClick={onLoadFFmpeg}>
          Prepare Export Engine
        </button>
        <p className="export-panel__note">
          The export engine (~30MB) must be prepared before exporting clips.
        </p>
      </div>
    );
  }

  if (ffmpegLoading) {
    return (
      <div className="export-panel">
        <p className="export-panel__loading">Preparing export engine…</p>
      </div>
    );
  }

  return (
    <div className="export-panel">
      <div className="export-panel__header">
        <span className="export-panel__ready">● Export engine ready</span>
        <button
          className="export-panel__export-btn"
          onClick={onExportAll}
          disabled={pendingCount === 0 || exportingCount > 0}
        >
          Export All Clips
        </button>
        {doneCount > 0 && (
          <button className="export-panel__export-btn" onClick={onDownloadZip}>
            Download All as ZIP
          </button>
        )}
        {pendingCount > 0 && (
          <span className="export-panel__count">
            {pendingCount} clip{pendingCount !== 1 ? 's' : ''} ready to export
          </span>
        )}
      </div>
      {(doneCount > 0 || errorCount > 0) && (
        <p className="export-panel__summary">
          {doneCount > 0 && `${doneCount} done`}
          {doneCount > 0 && errorCount > 0 && ', '}
          {errorCount > 0 && `${errorCount} error`}
        </p>
      )}
    </div>
  );
}
