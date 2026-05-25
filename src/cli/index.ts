#!/usr/bin/env node

import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { registerCommand } from './commands/register.js';
import { syncCommand } from './commands/sync.js';
import { syncToCommand } from './commands/sync-to.js';
import { statusCommand } from './commands/status.js';
import { configCommand } from './commands/config.js';
import { watchCommand } from './commands/watch.js';
import { visualizerCommand } from './commands/visualizer.js';

const program = new Command();

program
  .name('waslagenie')
  .description('Universal synchronization layer for AI agent orchestrators')
  .version('0.1.0');

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
    .option('--scope <scope>', 'user or workspace', 'workspace')
    .description('Scan and sync agents/MCPs across tools')
    .action((options) => syncCommand(options))
);

program.addCommand(
  new Command('sync-to')
    .option('--from <source>', 'Source tool (gemini, claude, etc.)')
    .option('--to <targets>', 'Target tool(s), comma-separated')
    .option('--scope <scope>', 'user or workspace', 'workspace')
    .description('Sync agents/MCPs from one tool to specific target(s)')
    .action((options) => syncToCommand(options))
);

program.addCommand(
  new Command('status')
    .option('--scope <scope>', 'user or workspace', 'workspace')
    .description('Show all discovered assets and their sync state')
    .action((options) => statusCommand(options))
);

program.addCommand(
  new Command('config')
    .option('--scope <scope>', 'Set scope to user or workspace')
    .option('--show', 'Show current config')
    .description('Configure WaslaGenie settings')
    .action((options) => configCommand(options))
);

program.addCommand(
  new Command('watch')
    .option('--scope <scope>', 'user or workspace', 'workspace')
    .description('Watch for changes and auto-sync')
    .action((options) => watchCommand(options))
);

program.addCommand(
  new Command('visualizer')
    .option('--scope <scope>', 'user or workspace', 'workspace')
    .option('--host <host>', 'Host to bind', '127.0.0.1')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .description('Open interactive sync visualizer with built-in backend')
    .action((options) => visualizerCommand(options))
);

program.addCommand(
  new Command('ui')
    .option('--scope <scope>', 'user or workspace', 'workspace')
    .option('--host <host>', 'Host to bind', '127.0.0.1')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .description('Alias for `visualizer`')
    .action((options) => visualizerCommand(options))
);

program.parse(process.argv);
