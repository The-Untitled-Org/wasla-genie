import type { Asset, AssetType } from '../core/types.js';

const ansi = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  cyan: '\u001b[36m',
  blue: '\u001b[34m',
  green: '\u001b[32m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  magenta: '\u001b[35m',
};

function color(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${ansi.reset}`;
}

export function banner(): void {
  console.log(
    color(
      `
 __        __         _        ____            _
 \\ \\      / /_ _ ___| | __ _ / ___| ___ _ __ (_) ___
  \\ \\ /\\ / / _\` / __| |/ _\` | |  _ / _ \\ '_ \\| |/ _ \\
   \\ V  V / (_| \\__ \\ | (_| | |_| |  __/ | | | |  __/
    \\_/\\_/ \\__,_|___/_|\\__,_|\\____|\\___|_| |_|_|\\___|
`,
      ansi.bold,
      ansi.cyan
    )
  );
}

export function success(message: string): void {
  console.log(color(`✔  ${message}`, ansi.green));
}

export function error(message: string): void {
  console.error(color(`✗  ${message}`, ansi.red));
}

export function info(message: string): void {
  console.log(color(`ℹ  ${message}`, ansi.blue));
}

export function warning(message: string): void {
  console.log(color(`⚠  ${message}`, ansi.yellow));
}

export function highlight(message: string): void {
  console.log(color(`✨ ${message}`, ansi.magenta, ansi.bold));
}

export function metric(label: string, value: string | number): void {
  console.log(`  ${color(label.padEnd(20), ansi.blue)} ${color(String(value), ansi.bold)}`);
}

export function assetList(
  assets: Asset[],
  includeModifiedAt = false,
  activeProviders?: string[]
): void {
  const assetTypes: AssetType[] = ['agent', 'skill', 'mcp', 'context'];
  const headings: Record<AssetType, string> = {
    agent: 'AGENTS',
    skill: 'SKILLS',
    mcp: 'MCP SERVERS',
    context: 'CONTEXT FILES',
  };
  const activeProviderSet = activeProviders ? new Set(activeProviders) : null;

  for (const type of assetTypes) {
    const typedAssets = assets
      .filter((asset) => asset.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (typedAssets.length === 0) continue;

    console.log(color(`  ${headings[type]} (${typedAssets.length})`, ansi.cyan, ansi.bold));
    for (const asset of typedAssets) {
      const providers = [...new Set(asset.stubs.map((stub) => stub.tool))]
        .sort()
        .filter((provider) => !activeProviderSet || activeProviderSet.has(provider));
      console.log(`  ${color('•', ansi.green)} ${color(asset.name, ansi.bold)}`);
      console.log(`    ${color('Mirrors:', ansi.blue)} ${providers.join(', ') || 'none'}`);
      if (includeModifiedAt) {
        console.log(
          `    ${color('Updated:', ansi.blue)} ${new Date(asset.last_modified_at).toLocaleString()}`
        );
      }
    }
    spacer();
  }
}

export function step(title: string): void {
  console.log(`\n${title}`);
}

export function section(title: string): void {
  console.log(color(`\n🔍 ${title}`, ansi.blue, ansi.bold));
}

export function table(rows: string[][], columnWidths?: number[]): void {
  if (rows.length === 0) return;

  // Calculate column widths if not provided
  const widths =
    columnWidths ||
    rows[0].map((_, i) => {
      return Math.max(...rows.map((row) => (row[i] || '').length));
    });

  rows.forEach((row) => {
    const line = row.map((cell, i) => (cell || '').padEnd(widths[i] || 10)).join('  ');
    console.log(line);
  });
}

export function spacer(): void {
  console.log('');
}

export function bulletPoint(text: string, indent = 0): void {
  const spaces = '  '.repeat(indent);
  console.log(`${spaces}• ${text}`);
}

export function code(text: string): string {
  return `\`${text}\``;
}
