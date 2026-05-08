import { useRef, useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const progressHandlerRef = useRef<
    (({ progress }: { progress: number }) => void) | null
  >(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        console.log('[ffmpeg]', message);
      });

      const baseURL = window.location.origin;
      const coreURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript'
      );
      const wasmURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      );
      await ffmpeg.load({ coreURL, wasmURL });

      setLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  const trim = useCallback(
    async (
      file: File,
      startTime: number,
      endTime: number,
      sourceWritten?: boolean
    ): Promise<Blob> => {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error('FFmpeg not loaded');

      if (!sourceWritten) {
        const fileData = await fetchFile(file);
        await ffmpeg.writeFile('input.mp4', fileData);
      }

      await ffmpeg.exec([
        '-i',
        'input.mp4',
        '-ss',
        startTime.toString(),
        '-to',
        endTime.toString(),
        '-c:v',
        'libx264',
        '-c:a',
        'aac',
        'output.mp4',
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      await ffmpeg.deleteFile('output.mp4');

      return new Blob([data], { type: 'video/mp4' });
    },
    []
  );

  const cleanup = useCallback(async () => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) return;
    try {
      await ffmpeg.deleteFile('input.mp4');
    } catch {
      // File may not exist — ignore
    }
  }, []);

  const extractFrame = useCallback(
    async (
      file: File,
      time: number,
      sourceWritten?: boolean
    ): Promise<Blob> => {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error('FFmpeg not loaded');

      if (!sourceWritten) {
        const fileData = await fetchFile(file);
        await ffmpeg.writeFile('input.mp4', fileData);
      }

      await ffmpeg.exec([
        '-ss',
        time.toString(),
        '-i',
        'input.mp4',
        '-frames:v',
        '1',
        '-q:v',
        '2',
        'frame.jpg',
      ]);

      const data = await ffmpeg.readFile('frame.jpg');
      await ffmpeg.deleteFile('frame.jpg');

      return new Blob([data], { type: 'image/jpeg' });
    },
    []
  );

  const setProgressCallback = useCallback(
    (callback: ((ratio: number) => void) | null) => {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) return;
      if (progressHandlerRef.current) {
        ffmpeg.off('progress', progressHandlerRef.current);
        progressHandlerRef.current = null;
      }
      if (callback) {
        const handler = ({ progress }: { progress: number }) =>
          callback(progress);
        progressHandlerRef.current = handler;
        ffmpeg.on('progress', handler);
      }
    },
    []
  );

  return {
    loaded,
    loading,
    load,
    trim,
    cleanup,
    extractFrame,
    setProgressCallback,
  };
}
