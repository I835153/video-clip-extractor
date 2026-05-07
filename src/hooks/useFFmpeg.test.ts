import { renderHook, act } from '@testing-library/react';
import { useFFmpeg } from './useFFmpeg';

// Mock @ffmpeg/ffmpeg
const mockLoad = vi.fn().mockResolvedValue(undefined);
const mockExec = vi.fn().mockResolvedValue(undefined);
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockReadFile = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
const mockDeleteFile = vi.fn().mockResolvedValue(undefined);

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    load = mockLoad;
    exec = mockExec;
    writeFile = mockWriteFile;
    readFile = mockReadFile;
    deleteFile = mockDeleteFile;
    on = vi.fn();
  },
}));

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn().mockResolvedValue('blob:mock'),
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

describe('useFFmpeg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state has loaded=false and loading=false', () => {
    const { result } = renderHook(() => useFFmpeg());
    expect(result.current.loaded).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('load() sets loading then loaded', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.loaded).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('load() handles errors gracefully', async () => {
    mockLoad.mockRejectedValueOnce(new Error('Load failed'));
    const { result } = renderHook(() => useFFmpeg());

    await expect(
      act(async () => {
        await result.current.load();
      }),
    ).rejects.toThrow('Load failed');

    expect(result.current.loaded).toBe(false);
    expect(result.current.loading).toBe(false);
  });
});
