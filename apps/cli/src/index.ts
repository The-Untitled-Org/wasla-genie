#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { installCommand } from './commands/install.js';
import { registerCommand } from './commands/register.js';
import { syncCommand } from './commands/sync.js';
import { syncToCommand } from './commands/sync-to.js';
import { statusCommand } from './commands/status.js';
import { configCommand } from './commands/config.js';
import { watchCommand } from './commands/watch.js';
import { visualizerCommand } from './server/visualizer-server.js';
import { banner } from './cli-output.js';

const program = new Command();
function readPackageVersion(moduleUrl: string): string {
  let directory = dirname(fileURLToPath(moduleUrl));
  while (true) {
    const packagePath = join(directory, 'package.json');
    if (existsSync(packagePath)) {
      return (JSON.parse(readFileSync(packagePath, 'utf-8')) as { version: string }).version;
    }
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Cannot find package.json');
    directory = parent;
  }
}

program
  .name('waslagenie')
  .description('Universal synchronization layer for AI agent orchestrators')
  .version(readPackageVersion(import.meta.url));

program.addCommand(
  new Command('install').description('Prepare WaslaGenie CLI state').action(installCommand)
);

program.addCommand(
  new Command('register')
    .option('--to <targets>', 'Target provider(s), comma-separated. Example: claude,gemini')
    .description('Register WaslaGenie helper skills inside installed AI tools')
    .action((options) => registerCommand(options))
);

program.addCommand(
  new Command('sync')
    .description('Scan and sync agents/MCPs across tools')
    .action(() => syncCommand())
);

program.addCommand(
  new Command('sync-to')
    .option('--from <source>', 'Source tool (gemini, claude, etc.)')
    .option('--to <targets>', 'Target tool(s), comma-separated')
    .description('Sync agents/MCPs from one tool to specific target(s)')
    .action((options) => syncToCommand(options))
);

program.addCommand(
  new Command('status')
    .description('Show all discovered assets and their sync state')
    .action(() => statusCommand())
);

program.addCommand(
  new Command('config')
    .option('--scope <scope>', 'Set scope to user or workspace')
    .option('--show', 'Show current config')
    .description('Configure WaslaGenie settings')
    .action(async (options) => {
      await configCommand(options);
    })
);

program.addCommand(
  new Command('watch').description('Watch for changes and auto-sync').action(() => watchCommand())
);

program.addCommand(
  new Command('visualizer')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .description('Open interactive sync visualizer with built-in backend')
    .action((options) => visualizerCommand(options))
);

program.addCommand(
  new Command('ui')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .description('Alias for `visualizer`')
    .action((options) => visualizerCommand(options))
);

banner();
program.parse(process.argv);
