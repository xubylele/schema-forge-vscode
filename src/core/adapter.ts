import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { ParseResult, normalizeError } from './errors';

/**
 * Create a Web Worker from the bundled worker script
 * @param workerPath - Path to the compiled worker script
 * @returns Web Worker instance or null if Worker API unavailable
 */
function createWorker(workerPath: string): Worker | null {
  try {
    // Note: In VS Code extension runtime (Node.js), we use worker_threads
    return new Worker(workerPath);
  } catch (err) {
    console.error('Failed to create worker:', err);
    return null;
  }
}

/**
 * Parse schema content asynchronously using a Web Worker
 * Falls back to synchronous parsing if Worker is unavailable
 * 
 * @param source - The .sf file content as a string
 * @param timeout - Timeout in milliseconds (default: 5000ms)
 * @returns Promise<ParseResult> with discriminated union result
 */
export async function parseSchemaContent(source: string, timeout: number = 5000): Promise<ParseResult> {
  // Validate input
  if (typeof source !== 'string') {
    const error = normalizeError('Input must be a string');
    return { ok: false, error };
  }

  if (source.trim() === '') {
    const error = normalizeError('Schema content cannot be empty');
    return { ok: false, error };
  }

  try {
    // Attempt to use worker path (will be bundled with extension)
    const extensionPath = __dirname;
    const workerPath = path.join(extensionPath, 'parser.worker.js');

    // Check if worker file exists
    if (!fs.existsSync(workerPath)) {
      // Fallback: Use synchronous parsing with Promise wrapper
      return parseSchemaContentSync(source);
    }

    // Use Worker approach
    return await parseSchemaWithWorker(source, workerPath, timeout);
  } catch (err) {
    // Fallback to synchronous parsing if any error occurs
    return parseSchemaContentSync(source);
  }
}

/**
 * Parse schema content synchronously (fallback method)
 * Wrapped in Promise for API consistency
 * 
 * @param source - The .sf file content as a string
 * @returns Promise<ParseResult> wrapped synchronous result
 */
async function parseSchemaContentSync(source: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    try {
      const { parseSchema } = require('@xubylele/schema-forge-core');
      const ast = parseSchema(source);
      resolve({ ok: true, ast });
    } catch (err) {
      const error = normalizeError(err);
      resolve({ ok: false, error });
    }
  });
}

/**
 * Parse schema content using a Web Worker with timeout
 * 
 * @param source - The .sf file content as a string
 * @param workerPath - Path to the worker script
 * @param timeout - Timeout in milliseconds
 * @returns Promise<ParseResult> with worker-based parsing result
 */
async function parseSchemaWithWorker(
  source: string,
  workerPath: string,
  timeout: number
): Promise<ParseResult> {
  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let timeoutHandle: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (worker) {
        try {
          worker.terminate();
        } catch {
          // Ignore termination errors
        }
      }
    };

    const resolveOnce = (result: ParseResult) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Set timeout
    timeoutHandle = setTimeout(() => {
      const error = normalizeError('Schema parsing timed out');
      resolveOnce({ ok: false, error });
    }, timeout);

    try {
      // Create worker
      worker = createWorker(workerPath);
      if (!worker) {
        throw new Error('Failed to create worker');
      }

      // Handle worker messages
      worker.on('message', (data: any) => {
        const { type, ok, ast, message } = data;

        if (type === 'result' && ok === true) {
          resolveOnce({ ok: true, ast });
        } else if (type === 'error' && ok === false) {
          const error = normalizeError(message);
          resolveOnce({ ok: false, error });
        } else {
          const error = normalizeError('Invalid response from parser worker');
          resolveOnce({ ok: false, error });
        }
      });

      // Handle worker errors
      worker.on('error', (workerError: Error) => {
        const error = normalizeError(workerError.message || 'Worker error');
        resolveOnce({ ok: false, error });
      });

      // Handle worker exit
      worker.on('exit', (code: number) => {
        if (!resolved && code !== 0) {
          const error = normalizeError(`Worker exited with code ${code}`);
          resolveOnce({ ok: false, error });
        }
      });

      // Send parse message
      worker.postMessage({ type: 'parse', source });
    } catch (err) {
      const error = normalizeError(err);
      resolveOnce({ ok: false, error });
    }
  });
}
