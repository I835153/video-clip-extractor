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
      })
    ).rejects.toThrow('Load failed');

    expect(result.current.loaded).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('trim() writes file, execs ffmpeg, and returns blob', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await act(async () => {
      await result.current.load();
    });

    const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });
    let blob: Blob | undefined;

    await act(async () => {
      blob = await result.current.trim(file, 5, 15);
    });

    expect(mockWriteFile).toHaveBeenCalledWith(
      'input.mp4',
      expect.any(Uint8Array)
    );
    expect(mockExec).toHaveBeenCalledWith([
      '-ss',
      '5',
      '-to',
      '15',
      '-i',
      'input.mp4',
      '-c',
      'copy',
      '-avoid_negative_ts',
      'make_zero',
      'output.mp4',
    ]);
    expect(mockReadFile).toHaveBeenCalledWith('output.mp4');
    expect(mockDeleteFile).toHaveBeenCalledWith('output.mp4');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('trim() with sourceWritten=true skips writeFile', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await act(async () => {
      await result.current.load();
    });

    mockWriteFile.mockClear();
    const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });

    await act(async () => {
      await result.current.trim(file, 0, 10, true);
    });

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('trim() throws if FFmpeg not loaded', async () => {
    const { result } = renderHook(() => useFFmpeg());

    const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });

    await expect(
      act(async () => {
        await result.current.trim(file, 0, 10);
      })
    ).rejects.toThrow('FFmpeg not loaded');
  });

  it('cleanup() deletes input.mp4', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await act(async () => {
      await result.current.load();
    });

    mockDeleteFile.mockClear();

    await act(async () => {
      await result.current.cleanup();
    });

    expect(mockDeleteFile).toHaveBeenCalledWith('input.mp4');
  });

  it('cleanup() ignores error if file does not exist', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await act(async () => {
      await result.current.load();
    });

    mockDeleteFile.mockRejectedValueOnce(new Error('File not found'));

    await act(async () => {
      await result.current.cleanup(); // should not throw
    });
  });
});
