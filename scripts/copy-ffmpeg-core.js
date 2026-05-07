import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');
const ffmpegCoreDir = join(projectRoot, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

const filesToCopy = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

for (const file of filesToCopy) {
  const src = join(ffmpegCoreDir, file);
  const dest = join(publicDir, file);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`Copied ${file} to public/`);
  } else {
    console.error(`WARNING: ${file} not found at ${src}`);
  }
}
