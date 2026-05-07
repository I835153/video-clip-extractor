import { formatTime, parseTime } from './formatTime';

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00.0');
  });

  it('formats seconds with decimal', () => {
    expect(formatTime(5.7)).toBe('00:05.7');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(155.4)).toBe('02:35.4');
  });

  it('formats large values', () => {
    expect(formatTime(3600)).toBe('60:00.0');
  });

  it('handles negative numbers', () => {
    expect(formatTime(-5)).toBe('00:00.0');
  });

  it('rounds to one decimal place', () => {
    expect(formatTime(0.05)).toBe('00:00.1');
  });
});

describe('parseTime', () => {
  it('parses MM:SS.d format', () => {
    expect(parseTime('02:35.4')).toBe(155.4);
  });

  it('parses MM:SS.d with small values', () => {
    expect(parseTime('00:05.7')).toBe(5.7);
  });

  it('parses zero', () => {
    expect(parseTime('00:00.0')).toBe(0);
  });

  it('parses SS.d format (no minutes)', () => {
    expect(parseTime('5.7')).toBe(5.7);
  });

  it('returns NaN for invalid string', () => {
    expect(parseTime('abc')).toBeNaN();
  });

  it('returns NaN for empty string', () => {
    expect(parseTime('')).toBeNaN();
  });
});

describe('round-trip', () => {
  it('formatTime → parseTime preserves value', () => {
    expect(parseTime(formatTime(155.4))).toBeCloseTo(155.4, 0);
  });

  it('formatTime → parseTime preserves zero', () => {
    expect(parseTime(formatTime(0))).toBe(0);
  });
});
