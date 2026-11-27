// Plucky's Great Escape — the program that hands the game in (Node 22,
// standard library only). The game itself is this repository's game/ folder:
// plain static files a desktop browser plays offline. This program copies
// game/ and screenshots/ into the output directory and writes dossier.json
// there with buildDossier from the vendored make.fun library, exactly the
// bytes the gate rebuilds and compares.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The run is deterministic — same repository in, same bytes out — and it
// never deletes the output directory itself (in the grader that directory
// is a mount point and cannot be removed); it only clears the two
// subdirectories it owns, so a stale file from an earlier local run can
// never leak into the hand-in.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — nothing to hand in');
}

function clearContents(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

// cpSync copies the repository's permission bits along with the bytes, and
// a repository checkout can be read-only — which would leave the copied
// tree impossible to clear on a second run. Normalise the copies to
// writable (directories 0755, files 0644); only permission bits change,
// never a single byte of content.
function makeWritable(dir) {
  chmodSync(dir, 0o755);
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) makeWritable(path);
    else chmodSync(path, 0o644);
  }
}

mkdirSync(outputDir, { recursive: true });
for (const sub of ['game', 'screenshots']) {
  const target = join(outputDir, sub);
  mkdirSync(target, { recursive: true });
  clearContents(target);
  cpSync(join(repoRoot, sub), target, { recursive: true });
  makeWritable(target);
}

// The caps are the competition gate's own: dossier text at most 160 KiB,
// at most 4 screenshots of at most 256 KiB each, game/ at most 993 entries
// and 48 MiB in all with no path over 1,000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
