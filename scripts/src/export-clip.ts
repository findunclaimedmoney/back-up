import { chromium } from 'playwright';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const CLIP_URL = 'http://localhost:80/missingcash-clip/';
const TOTAL_MS = 44000 + 6000 + 6000 + 7500 + 7000 + 6000; // 76500ms
const BUFFER_MS = 3000;
const WORKSPACE = path.resolve(__dirname, '../../..');
const OUT_DIR = path.join(WORKSPACE, 'artifacts/missingcash-clip/public');
const FINAL_MP4 = path.join(OUT_DIR, 'missingcash-clip.mp4');
const BG_MUSIC = path.join(OUT_DIR, 'audio/bg_music.mp3');
const MIA_VIDEO = path.join(OUT_DIR, 'videos/mia-talk.mp4');

async function record() {
  console.log(`Recording ${TOTAL_MS / 1000}s clip from ${CLIP_URL} ...`);

  const tmpDir = fs.mkdtempSync('/tmp/clip-');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: tmpDir, size: { width: 1280, height: 720 } },
  });

  const page = await context.newPage();

  // Mute all media so browser doesn't block autoplay
  await page.addInitScript(() => {
    window.HTMLMediaElement.prototype.play = function () {
      this.muted = true;
      return HTMLMediaElement.prototype.play.call(this);
    };
  });

  await page.goto(CLIP_URL, { waitUntil: 'networkidle' });

  console.log(`Waiting ${(TOTAL_MS + BUFFER_MS) / 1000}s for playback...`);
  await page.waitForTimeout(TOTAL_MS + BUFFER_MS);

  await page.close();
  await context.close();
  await browser.close();

  // Find recorded webm
  const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.webm'));
  if (!files.length) throw new Error('No webm recorded in ' + tmpDir);
  const webm = path.join(tmpDir, files[0]);
  console.log(`Captured: ${webm}`);

  // Mix visual + audio tracks
  console.log('Encoding MP4 with audio...');
  execSync(
    `ffmpeg -y \
      -i "${webm}" \
      -i "${MIA_VIDEO}" \
      -i "${BG_MUSIC}" \
      -filter_complex \
        "[1:a]atrim=0:${TOTAL_MS / 1000},asetpts=PTS-STARTPTS,volume=1.0[mia]; \
         [2:a]atrim=0:${TOTAL_MS / 1000},asetpts=PTS-STARTPTS,volume=0.25[music]; \
         [mia][music]amix=inputs=2:duration=longest[aout]" \
      -map 0:v -map "[aout]" \
      -t ${TOTAL_MS / 1000} \
      -c:v libx264 -pix_fmt yuv420p -crf 20 -preset fast \
      -c:a aac -b:a 192k -movflags +faststart \
      "${FINAL_MP4}"`,
    { stdio: 'inherit' }
  );

  fs.rmSync(tmpDir, { recursive: true });
  const sizeMb = (fs.statSync(FINAL_MP4).size / 1024 / 1024).toFixed(1);
  console.log(`\n✓ Done: ${FINAL_MP4} (${sizeMb} MB)`);
}

record().catch(err => { console.error(err); process.exit(1); });
