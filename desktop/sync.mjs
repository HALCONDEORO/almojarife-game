// Copies the playable game files from the repository root into desktop/app/
// so the Electron shell and the packaged app serve exactly what the browser
// version serves. Run before `electron .` or `electron-builder`.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'desktop', 'app');
const ITEMS = ['index.html', 'src', 'web', 'data', 'assets', 'locales', 'vendor', 'tools/geo.mjs', 'LICENSE', 'LICENSE-ART.md', 'CREDITS.md'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const item of ITEMS) {
  mkdirSync(path.dirname(path.join(out, item)), { recursive: true });
  cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log('desktop/app synced from repository root');
