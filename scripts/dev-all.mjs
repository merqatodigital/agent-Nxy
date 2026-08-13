import { spawn } from 'node:child_process';

const children = [];
let shuttingDown = false;

function start(label, args) {
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: process.env
  });
  children.push(child);
  child.on('exit', code => {
    if (shuttingDown) return;
    if (code && code !== 0) {
      console.error(`[dev:all] ${label} exited with code ${code}`);
      shutdown(code);
    }
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 250).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start('server', ['--import', 'tsx', 'server.ts']);
start('autonomy worker', ['--import', 'tsx', 'server/worker/autonomyWorker.ts']);
