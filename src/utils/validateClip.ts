import { Clip } from '../types/clip';

export function validateClip(
  startTime: number,
  endTime: number,
  videoDuration: number
): { valid: boolean; error?: string } {
  if (startTime < 0) {
    return { valid: false, error: 'Start time cannot be negative' };
  }
  if (endTime > videoDuration) {
    return { valid: false, error: 'End time exceeds video duration' };
  }
  if (startTime >= endTime) {
    return { valid: false, error: 'Start time must be before end time' };
  }
  if (endTime - startTime < 1.0) {
    return { valid: false, error: 'Clip must be at least 1 second long' };
  }
  return { valid: true };
}

export function findOverlaps(clips: Clip[]): Array<[string, string]> {
  const overlaps: Array<[string, string]> = [];
  for (let i = 0; i < clips.length; i++) {
    for (let j = i + 1; j < clips.length; j++) {
      const a = clips[i];
      const b = clips[j];
      if (a.startTime < b.endTime && a.endTime > b.startTime) {
        overlaps.push([a.id, b.id]);
      }
    }
  }
  return overlaps;
}
