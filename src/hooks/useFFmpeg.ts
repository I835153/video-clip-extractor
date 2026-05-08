import { useRef, useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
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
        '-ss',
        startTime.toString(),
        '-to',
        endTime.toString(),
        '-i',
        'input.mp4',
        '-c',
        'copy',
        '-avoid_negative_ts',
        'make_zero',
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

  return { loaded, loading, load, trim, cleanup };
}
