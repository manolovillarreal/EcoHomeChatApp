import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(appRoot, 'dist');
const targetDir = path.resolve(appRoot, '..', 'chat-service', 'public');

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Build output not found: ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Deployed ${sourceDir} -> ${targetDir}`);
