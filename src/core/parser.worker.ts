import { DatabaseSchema, parseSchema } from '@xubylele/schema-forge-core';
import { parentPort } from 'worker_threads';

/**
 * Message structure for worker communication
 */
interface ParseMessage {
  type: 'parse';
  source: string;
}

interface ParseResultMessage {
  type: 'result';
  ok: true;
  ast: DatabaseSchema;
}

interface ParseErrorMessage {
  type: 'error';
  ok: false;
  message: string;
}

type ResultMessage = ParseResultMessage | ParseErrorMessage;

/**
 * Handle messages from the main thread
 */
if (parentPort) {
  parentPort.on('message', (event: ParseMessage) => {
    const { type, source } = event;

    if (type !== 'parse') {
      const errorMsg: ParseErrorMessage = {
        type: 'error',
        ok: false,
        message: 'Invalid message type',
      };
      parentPort?.postMessage(errorMsg);
      return;
    }

    try {
      const ast = parseSchema(source);
      const result: ParseResultMessage = {
        type: 'result',
        ok: true,
        ast,
      };
      parentPort?.postMessage(result);
    } catch (err) {
      let message = 'Unknown parsing error';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }

      const errorMsg: ParseErrorMessage = {
        type: 'error',
        ok: false,
        message,
      };
      parentPort?.postMessage(errorMsg);
    }
  });
}
