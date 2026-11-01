import type { StoredSession } from '../storage/store';
import { indexFile } from './indexFile';

export interface IndexRequest {
  files: File[];
}

export type IndexMessage =
  | { type: 'batch'; items: StoredSession[] }
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; failed: string[] };

interface WorkerScope {
  onmessage: ((event: MessageEvent<IndexRequest>) => void) | null;
  postMessage(message: IndexMessage): void;
}

const BATCH_SIZE = 25;
const scope = self as unknown as WorkerScope;

scope.onmessage = async (event) => {
  const { files } = event.data;
  const failed: string[] = [];
  let batch: StoredSession[] = [];
  let done = 0;

  const flush = () => {
    if (batch.length === 0) return;
    scope.postMessage({ type: 'batch', items: batch });
    batch = [];
  };

  for (const file of files) {
    try {
      batch.push(
        indexFile(file.name, await file.text(), file.size, file.lastModified),
      );
    } catch {
      failed.push(file.name);
    }
    done += 1;
    if (batch.length >= BATCH_SIZE) {
      flush();
      scope.postMessage({ type: 'progress', done, total: files.length });
    }
  }
  flush();
  scope.postMessage({ type: 'progress', done, total: files.length });
  scope.postMessage({ type: 'done', failed });
};
