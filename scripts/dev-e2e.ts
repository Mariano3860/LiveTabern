import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ChildProcess } from 'node:child_process';

const root = process.cwd();
const localDir = resolve(root, '.local');
mkdirSync(localDir, { recursive: true });

const server = spawn(
  process.execPath,
  [resolve(root, 'node_modules/tsx/dist/cli.mjs'), '--env-file-if-exists=.env', 'apps/server/index.ts'],
  {
    cwd: root,
    env: {
      ...process.env,
      PORT: '3002',
      WORLD_DB: resolve(localDir, `e2e-visual-${process.pid}.sqlite`),
      DIRECTOR_MODE: 'off',
    },
    stdio: 'inherit',
  },
);

let web: ChildProcess | undefined;
let stopping = false;
const stopChildren = () => {
  stopping = true;
  if (server.exitCode === null) server.kill();
  if (web?.exitCode === null) web.kill();
};
process.once('SIGINT', stopChildren);
process.once('SIGTERM', stopChildren);

try {
  let ready = false;
  for (let attempt = 0; attempt < 60 && server.exitCode === null; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:3002/health');
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The simulation server is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  if (!ready) throw new Error('The isolated E2E simulation server did not become healthy.');

  web = spawn(
    process.execPath,
    [resolve(root, 'node_modules/vite/bin/vite.js'), '--config', 'vite.e2e.config.ts'],
    { cwd: root, env: process.env, stdio: 'inherit' },
  );
  const ended = await Promise.race(
    [server, web].map(
      (child) =>
        new Promise<{ child: ChildProcess; code: number | null }>((resolveExit) =>
          child.once('exit', (code) => resolveExit({ child, code })),
        ),
    ),
  );
  if (!stopping) {
    for (const child of [server, web]) if (child !== ended.child && child.exitCode === null) child.kill();
    process.exitCode = ended.code ?? 1;
  }
} catch (error) {
  console.error(error);
  stopChildren();
  process.exitCode = 1;
}
