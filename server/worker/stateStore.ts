import fs from 'node:fs/promises';
import path from 'node:path';
import type { WorkerState } from './types.js';

const DEFAULT_STATE: WorkerState = {
  version: 1,
  researchTargets: [],
  emailJobs: []
};

export class WorkerStateStore {
  private readonly filePath: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(filePath = process.env.NYX_WORKER_STATE_FILE || path.join(process.cwd(), '.nyx', 'worker-state.json')) {
    this.filePath = filePath;
  }

  async load(): Promise<WorkerState> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as WorkerState;
      return {
        ...DEFAULT_STATE,
        ...parsed,
        researchTargets: Array.isArray(parsed.researchTargets) ? parsed.researchTargets : [],
        emailJobs: Array.isArray(parsed.emailJobs) ? parsed.emailJobs : []
      };
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
      await this.save(DEFAULT_STATE);
      return structuredClone(DEFAULT_STATE);
    }
  }

  async save(state: WorkerState): Promise<void> {
    const snapshot = JSON.stringify(state, null, 2);
    this.writeChain = this.writeChain.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tempPath = `${this.filePath}.tmp`;
      await fs.writeFile(tempPath, snapshot, 'utf8');
      await fs.rename(tempPath, this.filePath);
    });
    return this.writeChain;
  }
}
