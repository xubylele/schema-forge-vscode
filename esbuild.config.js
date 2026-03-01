const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        if (!location) {
          console.error(`✘ [ERROR] ${text}`);
          return;
        }
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  }
};

async function main() {
  // Build extension entry point
  const extensionContext = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    sourcesContent: false,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin]
  });

  // Build worker entry point
  const workerContext = await esbuild.context({
    entryPoints: ['src/core/parser.worker.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    sourcesContent: false,
    outfile: 'dist/parser.worker.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin]
  });

  // Build test runner
  const testContext = await esbuild.context({
    entryPoints: [
      'src/test/runTest.ts',
      'src/test/suite/index.ts',
      'src/test/extension.test.ts',
      'src/test/suite/errors.test.ts',
      'src/test/suite/adapter.test.ts',
      'src/test/suite/workspace.test.ts',
      'src/test/suite/output.test.ts',
      'src/test/suite/semanticDiagnostics.test.ts',
      'src/test/suite/hoverProvider.test.ts'
    ],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    sourcesContent: false,
    outdir: 'dist/test',
    outbase: 'src',
    external: ['vscode', 'mocha', '@vscode/test-electron'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin]
  });

  if (watch) {
    await Promise.all([
      extensionContext.watch(),
      workerContext.watch(),
      testContext.watch()
    ]);
    return;
  }

  await Promise.all([
    extensionContext.rebuild(),
    workerContext.rebuild(),
    testContext.rebuild()
  ]);
  await Promise.all([
    extensionContext.dispose(),
    workerContext.dispose(),
    testContext.dispose()
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
