export function formatTime(seconds: number): string {
  if (seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const m = mins.toString().padStart(2, '0');
  const s = Math.floor(secs).toString().padStart(2, '0');
  const d = Math.round((secs % 1) * 10);
  return `${m}:${s}.${d}`;
}

export function parseTime(str: string): number {
  if (!str || typeof str !== 'string') return NaN;
  const trimmed = str.trim();

  // MM:SS.d format
  const match = trimmed.match(/^(\d+):(\d+(?:\.\d+)?)$/);
  if (match) {
    const mins = parseInt(match[1], 10);
    const secs = parseFloat(match[2]);
    return mins * 60 + secs;
  }

  // SS.d or SS format (no colon)
  const num = parseFloat(trimmed);
  if (!isNaN(num) && /^\d+(\.\d+)?$/.test(trimmed)) {
    return num;
  }

  return NaN;
}
