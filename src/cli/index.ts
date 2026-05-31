#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { installCommand } from './commands/install.js';
import { registerCommand } from './commands/register.js';
import { syncCommand } from './commands/sync.js';
import { syncToCommand } from './commands/sync-to.js';
import { statusCommand } from './commands/status.js';
import { configCommand } from './commands/config.js';
import { watchCommand } from './commands/watch.js';
import { visualizerCommand } from './commands/visualizer.js';
import { banner } from '../utils/cli-output.js';

const program = new Command();
const packageVersion = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')
) as { version: string };

program
  .name('waslagenie')
  .description('Universal synchronization layer for AI agent orchestrators')
  .version(packageVersion.version);

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
    .option('--host <host>', 'Host to bind', '127.0.0.1')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .description('Open interactive sync visualizer with built-in backend')
    .action((options) => visualizerCommand(options))
);

program.addCommand(
  new Command('ui')
    .option('--host <host>', 'Host to bind', '127.0.0.1')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .description('Alias for `visualizer`')
    .action((options) => visualizerCommand(options))
);

banner();
program.parse(process.argv);
