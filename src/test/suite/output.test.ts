import * as assert from 'assert';
import { getOutputChannel, logToOutput, logInfo, logWarn, logError, clearOutput, showOutput } from '../../output';

suite('Output Module Test Suite', () => {
  test('getOutputChannel should create and return output channel', () => {
    const channel = getOutputChannel();
    assert.ok(channel);
    assert.ok(channel.name);
  });

  test('getOutputChannel should return same instance on multiple calls', () => {
    const channel1 = getOutputChannel();
    const channel2 = getOutputChannel();
    assert.strictEqual(channel1, channel2);
  });

  test('logToOutput should not throw', () => {
    assert.doesNotThrow(() => {
      logToOutput('Test message');
    });
  });

  test('logInfo should not throw', () => {
    assert.doesNotThrow(() => {
      logInfo('Info message');
    });
  });

  test('logWarn should not throw', () => {
    assert.doesNotThrow(() => {
      logWarn('Warning message');
    });
  });

  test('logError should not throw', () => {
    assert.doesNotThrow(() => {
      logError('Error message');
    });
  });

  test('clearOutput should not throw', () => {
    assert.doesNotThrow(() => {
      clearOutput();
    });
  });

  test('showOutput should not throw', () => {
    assert.doesNotThrow(() => {
      showOutput();
    });
  });

  test('Output functions work in sequence', () => {
    assert.doesNotThrow(() => {
      clearOutput();
      logToOutput('Raw message');
      logInfo('Info');
      logWarn('Warning');
      logError('Error');
    });
  });
});
