import type { StoredSession } from '../storage/store';
import type { IndexMessage, IndexRequest } from './indexer.worker';

export interface IndexHandlers {
  onBatch(items: StoredSession[]): void;
  onProgress(done: number, total: number): void;
}

/**
 * Parses the given files in a Web Worker so the page stays responsive.
 * Resolves with the names of the files that could not be read.
 */
export function runIndexer(
  files: File[],
  handlers: IndexHandlers,
): Promise<string[]> {
  if (files.length === 0) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./indexer.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<IndexMessage>) => {
      const message = event.data;
      if (message.type === 'batch') handlers.onBatch(message.items);
      else if (message.type === 'progress')
        handlers.onProgress(message.done, message.total);
      else {
        worker.terminate();
        resolve(message.failed);
      }
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };
    const request: IndexRequest = { files };
    worker.postMessage(request);
  });
}
