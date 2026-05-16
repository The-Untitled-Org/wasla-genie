export function success(message: string): void {
  console.log(`✔  ${message}`);
}

export function error(message: string): void {
  console.error(`✗  ${message}`);
}

export function info(message: string): void {
  console.log(`ℹ  ${message}`);
}

export function warning(message: string): void {
  console.log(`⚠  ${message}`);
}

export function highlight(message: string): void {
  console.log(`✨ ${message}`);
}

export function step(title: string): void {
  console.log(`\n${title}`);
}

export function section(title: string): void {
  console.log(`\n🔍 ${title}`);
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
