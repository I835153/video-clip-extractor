import { validateClip, findOverlaps } from './validateClip';
import { Clip } from '../types/clip';

const makeClip = (id: string, start: number, end: number): Clip => ({
  id,
  label: id,
  startTime: start,
  endTime: end,
  status: 'pending',
});

describe('validateClip', () => {
  it('accepts a valid clip', () => {
    expect(validateClip(5, 15, 60)).toEqual({ valid: true });
  });

  it('rejects negative start time', () => {
    const result = validateClip(-1, 5, 60);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/negative/i);
  });

  it('rejects end time exceeding duration', () => {
    const result = validateClip(5, 65, 60);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/exceeds/i);
  });

  it('rejects start >= end', () => {
    const result = validateClip(15, 5, 60);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/before/i);
  });

  it('rejects start equals end', () => {
    const result = validateClip(5, 5, 60);
    expect(result.valid).toBe(false);
  });

  it('rejects too short duration', () => {
    const result = validateClip(5, 5.5, 60);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/1 second/i);
  });

  it('accepts minimum valid duration', () => {
    expect(validateClip(5, 6, 60)).toEqual({ valid: true });
  });

  it('accepts start at 0', () => {
    expect(validateClip(0, 5, 60)).toEqual({ valid: true });
  });

  it('accepts end at duration', () => {
    expect(validateClip(5, 60, 60)).toEqual({ valid: true });
  });
});

describe('findOverlaps', () => {
  it('returns empty for non-overlapping clips', () => {
    const clips = [makeClip('a', 0, 5), makeClip('b', 10, 15)];
    expect(findOverlaps(clips)).toEqual([]);
  });

  it('returns pair for overlapping clips', () => {
    const clips = [makeClip('a', 0, 10), makeClip('b', 5, 15)];
    expect(findOverlaps(clips)).toEqual([['a', 'b']]);
  });

  it('returns empty for adjacent clips (not overlapping)', () => {
    const clips = [makeClip('a', 0, 5), makeClip('b', 5, 10)];
    expect(findOverlaps(clips)).toEqual([]);
  });
});
