import { DatabaseSchema, parseSchema } from '@xubylele/schema-forge-core';

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
self.onmessage = (event: MessageEvent<ParseMessage>) => {
  const { type, source } = event.data;

  if (type !== 'parse') {
    const errorMsg: ParseErrorMessage = {
      type: 'error',
      ok: false,
      message: 'Invalid message type',
    };
    self.postMessage(errorMsg);
    return;
  }

  try {
    const ast = parseSchema(source);
    const result: ParseResultMessage = {
      type: 'result',
      ok: true,
      ast,
    };
    self.postMessage(result);
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
    self.postMessage(errorMsg);
  }
};
