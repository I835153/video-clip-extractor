import { validateClip } from './validateClip';

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
