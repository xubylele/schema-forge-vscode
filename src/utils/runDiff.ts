import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getWorkspaceFolder } from './workspace';

/** Exit code from schema-forge CLI when drift is detected (aligned with schema-forge exitCodes) */
export const DRIFT_EXIT_CODE = 2;

function getLocalCliPath(): string | null {
	const possiblePaths = [
		path.join(__dirname, '../../../schema-forge/dist/cli.js'),
		path.join(__dirname, '../../../../schema-forge/dist/cli.js'),
	];

	for (const cliPath of possiblePaths) {
		if (fs.existsSync(cliPath)) {
			return cliPath;
		}
	}

	return null;
}

/**
 * Run schema-forge diff headlessly and return the process exit code.
 * Does not show or clear the output channel.
 * @returns Exit code (0 = success, 2 = drift, etc.), or null if no workspace or spawn failed.
 */
export function runDiff(): Promise<number | null> {
	return new Promise((resolve) => {
		getWorkspaceFolder().then((workspaceFolder) => {
			if (!workspaceFolder) {
				resolve(null);
				return;
			}

			const localCliPath = getLocalCliPath();
			const command = localCliPath
				? `node "${localCliPath}" diff`
				: `npx --yes @xubylele/schema-forge diff`;

			const childProcess = spawn(command, [], {
				cwd: workspaceFolder.uri.fsPath,
				shell: true,
				env: { ...process.env, FORCE_COLOR: '0' },
			});

			childProcess.on('close', (code: number | null) => {
				resolve(code ?? null);
			});

			childProcess.on('error', () => {
				resolve(null);
			});
		});
	});
}
