import { startServer } from './server/app.js';

startServer().catch((error) => {
  console.error('[Nyx Server] Fatal startup error:', error);
  process.exitCode = 1;
});
