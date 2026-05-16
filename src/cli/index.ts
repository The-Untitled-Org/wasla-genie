#!/usr/bin/env node

import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { syncCommand } from './commands/sync.js';
import { statusCommand } from './commands/status.js';
import { configCommand } from './commands/config.js';
import { watchCommand } from './commands/watch.js';

const program = new Command();

program
  .name('waslagenie')
  .description('Universal synchronization layer for AI agent orchestrators')
  .version('0.1.0');

program.addCommand(
  new Command('install').description('Detect tools and register WaslaGenie').action(installCommand)
);

program.addCommand(
  new Command('sync')
    .option('--scope <scope>', 'user or workspace', 'workspace')
    .description('Scan and sync agents/MCPs across tools')
    .action((options) => syncCommand(options))
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

program.parse(process.argv);
