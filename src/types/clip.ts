export interface Clip {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'exporting' | 'done' | 'error';
  progress?: number;
  outputUrl?: string;
  error?: string;
  thumbnailUrl?: string;
}

export interface VideoInfo {
  file: File;
  name: string;
  size: number;
  duration: number;
  objectUrl: string;
}
