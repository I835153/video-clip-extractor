import { useRef, useState, DragEvent } from 'react';
import { VideoInfo } from '../types/clip';
import './VideoUploader.css';

interface VideoUploaderProps {
  onVideoSelected: (video: VideoInfo) => void;
}

export default function VideoUploader({ onVideoSelected }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousUrlRef = useRef<string | null>(null);

  function handleFile(file: File) {
    if (file.type !== 'video/mp4') {
      setError('Only MP4 files are supported. Please select a .mp4 file.');
      return;
    }

    setError(null);

    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previousUrlRef.current = objectUrl;

    onVideoSelected({
      file,
      name: file.name,
      size: file.size,
      duration: 0,
      objectUrl,
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  return (
    <div>
      <div
        className={`upload-zone ${isDragging ? 'upload-zone--dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
      >
        <p>Drag &amp; drop an MP4 file here, or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4"
          onChange={handleInputChange}
          hidden
        />
      </div>
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
