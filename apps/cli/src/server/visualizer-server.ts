import { createServer, IncomingMessage, ServerResponse } from 'http';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { RegistryManager } from '#core/registry.js';
import { getAllAdapters, getInstalledAdapters } from '#adapters/factory.js';
import { error, highlight, info, section, spacer } from '../cli-output.js';
import { Syncer } from '#sync/index.js';
import { Scanner } from '#sync/scanner.js';
import { requireConfiguredScope } from '#shared/config.js';
import type {
  ConnectionChangedMessage,
  ConnectionChangedResultMessage,
  VisualizerConfiguration,
  VisualizerEntity,
  VisualizerEntityType,
} from '#core/visualizer-types.js';

export function resolveVisualizerDist(moduleUrl: string): string {
  return resolve(dirname(fileURLToPath(moduleUrl)), '../../../../visualizer');
}

interface VisualizerOptions {
  port?: string;
  noOpen?: boolean;
}

async function getEntityContent(
  scope: 'user' | 'workspace',
  type: VisualizerEntityType,
  name: string,
  providerId: string
): Promise<string | null> {
  const scanner = new Scanner(scope);
  await scanner.initialize();
  const assetType = mapEntityType(type);
  const discovered =
    providerId === 'waslagenie'
      ? await scanner.scanAllTools([assetType])
      : await scanner.scanTool(providerId, [assetType]);
  const target = discovered
    .filter((item) => mapType(item.type) === type && item.name === name)
    .sort((a, b) => b.modifiedAt - a.modifiedAt)[0];
  if (!target) return null;

  if (target.content) return target.content;

  try {
    return await readFile(target.path, 'utf-8');
  } catch {
    return null;
  }
}

function isVisualizerEntityType(type: string | null): type is VisualizerEntityType {
  return type === 'instruction' || type === 'agent' || type === 'skill' || type === 'mcp';
}

function mapType(type: 'agent' | 'skill' | 'mcp' | 'context'): VisualizerEntityType {
  if (type === 'context') return 'instruction';
  return type;
}

function isAllowedOrigin(origin: string | undefined, port: number): boolean {
  if (!origin) return true;
  return origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`;
}

function isKnownProvider(scope: 'user' | 'workspace', providerId: string): boolean {
  return (
    providerId === 'waslagenie' ||
    getAllAdapters(scope).some((adapter) => adapter.name === providerId)
  );
}

function mapEntityType(type: VisualizerEntityType): 'agent' | 'skill' | 'mcp' | 'context' {
  if (type === 'instruction') return 'context';
  return type;
}

function mimeType(file: string): string {
  const ext = extname(file);
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.ico') return 'image/x-icon';
  return 'text/plain; charset=utf-8';
}

function openBrowser(url: string): void {
  const platform = process.platform;
  if (platform === 'darwin') {
    exec(`open "${url}"`);
    return;
  }
  if (platform === 'win32') {
    exec(`start "" "${url}"`);
    return;
  }
  exec(`xdg-open "${url}"`);
}

export const PROVIDER_ICONS: Record<string, string> = {
  waslagenie: '/logo.png',
  claude: 'https://cdn.simpleicons.org/claude',
  gemini: 'https://cdn.simpleicons.org/googlegemini',
  cursor: 'https://cdn.simpleicons.org/cursor',
  opencode: 'https://cdn.simpleicons.org/openai',
  openclaw: 'https://cdn.simpleicons.org/anthropic',
  'github-copilot': 'https://cdn.simpleicons.org/githubcopilot',
  'github-copilot-cli': 'https://cdn.simpleicons.org/github',
};

async function buildConfig(scope: 'user' | 'workspace'): Promise<VisualizerConfiguration> {
  const scanner = new Scanner(scope);
  await scanner.initialize();
  const discovered = await scanner.scanAllTools();

  const installed = await getInstalledAdapters(scope);
  const installedNames = new Set(installed.map((adapter) => adapter.name));

  const providers = [
    {
      id: 'waslagenie',
      title: 'WaslaGenie',
      iconUrl: PROVIDER_ICONS.waslagenie,
      isHub: true,
      isInstalled: true,
    },
    ...getAllAdapters(scope).map((adapter) => ({
      id: adapter.name,
      title: adapter.displayName,
      iconUrl: PROVIDER_ICONS[adapter.name],
      isInstalled: installedNames.has(adapter.name),
    })),
  ];

  const entityMap = new Map<string, VisualizerEntity>();
  for (const file of discovered) {
    const type = mapType(file.type);
    const id = `${type}:${file.name}`;
    if (!entityMap.has(id)) {
      entityMap.set(id, { id, name: file.name, type });
    }
  }
  const entities = Array.from(entityMap.values());

  const grouped = {
    instructions: entities.filter((e) => e.type === 'instruction'),
    agents: entities.filter((e) => e.type === 'agent'),
    skills: entities.filter((e) => e.type === 'skill'),
    mcps: entities.filter((e) => e.type === 'mcp'),
  };

  const registry = new RegistryManager(scope);
  await registry.load();
  const reg = registry.get();

  const connectionMap = new Map<string, { entityId: string; providerId: string }>();
  const addConnection = (entityId: string, providerId: string) => {
    connectionMap.set(`${entityId}|${providerId}`, { entityId, providerId });
  };

  for (const file of discovered) {
    addConnection(`${mapType(file.type)}:${file.name}`, file.tool);
  }

  for (const asset of reg.assets) {
    const entityType = mapType(asset.type);
    const entityId = `${entityType}:${asset.name}`;
    for (const stub of asset.stubs) {
      addConnection(entityId, stub.tool);
    }
  }

  return {
    providers,
    entities: grouped,
    connections: Array.from(connectionMap.values()),
  };
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(text);
}

export async function visualizerCommand(options: VisualizerOptions): Promise<void> {
  try {
    const scope = await requireConfiguredScope();
    const host = '127.0.0.1';
    const port = Number(options.port || 4072);
    const shouldOpen = options.noOpen !== true;

    section('Starting visualizer...');
    spacer();

    const visualizerDist = resolveVisualizerDist(import.meta.url);
    if (!existsSync(visualizerDist)) {
      error('Visualizer assets not found. Build first with: npm run visualizer:build');
      process.exit(1);
    }

    const registry = new RegistryManager(scope);
    await registry.load();
    const scanner = new Scanner(scope);
    const syncer = new Syncer(registry, scanner, scope);
    const shutdown = () => {
      wss.close();
      server.close();
      setTimeout(() => process.exit(0), 100).unref();
    };

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url || '/';
      const parsed = new URL(`http://${host}:${port}${url}`);
      const pathname = parsed.pathname;

      if (!isAllowedOrigin(req.headers.origin, port)) {
        sendJson(res, 403, { error: 'Forbidden origin' });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/config') {
        sendJson(res, 200, await buildConfig(scope));
        return;
      }

      if (req.method === 'GET' && pathname === '/api/entity-content') {
        const type = parsed.searchParams.get('type');
        const name = parsed.searchParams.get('name');
        const providerId = parsed.searchParams.get('provider');
        if (
          !isVisualizerEntityType(type) ||
          !name ||
          !providerId ||
          !isKnownProvider(scope, providerId)
        ) {
          sendJson(res, 400, { error: 'valid type, name, and provider are required' });
          return;
        }
        const content = await getEntityContent(scope, type, name, providerId);
        sendJson(res, 200, { content: content ?? '' });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/shutdown') {
        sendJson(res, 200, { ok: true });
        setTimeout(shutdown, 50);
        return;
      }

      if (pathname === '/' || pathname === '/index.html') {
        const html = await readFile(join(visualizerDist, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      const staticPath = join(visualizerDist, pathname.replace(/^\//, ''));
      if (!staticPath.startsWith(visualizerDist) || !existsSync(staticPath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const payload = await readFile(staticPath);
      res.writeHead(200, { 'Content-Type': mimeType(staticPath) });
      res.end(payload);
    });

    const wss = new WebSocketServer({
      server,
      verifyClient: ({ origin }: { origin: string }) => isAllowedOrigin(origin, port),
    });
    wss.on('connection', (socket: WebSocket) => {
      socket.on('message', async (raw: RawData) => {
        let requestId = '';
        try {
          const data = JSON.parse(raw.toString()) as Partial<ConnectionChangedMessage>;

          if (data.type !== 'CONNECTION_CHANGED' || !data.requestId || !data.payload) return;
          requestId = data.requestId;
          const { sourceEntity, entityType, sourceProvider, targetProvider, action } = data.payload;
          if (
            !sourceEntity ||
            !isVisualizerEntityType(entityType) ||
            !sourceProvider ||
            !targetProvider ||
            (action !== 'ATTACH' && action !== 'DETACH')
          ) {
            return;
          }

          info(
            `[Visualizer] ${action} ${entityType}:${sourceEntity} ${
              action === 'ATTACH' ? 'to' : 'from'
            } ${targetProvider}`
          );

          if (action === 'ATTACH') {
            await syncer.attachAssetToTool(
              sourceEntity,
              mapEntityType(entityType),
              sourceProvider,
              targetProvider
            );
          } else {
            await syncer.detachAssetFromTool(
              sourceEntity,
              mapEntityType(entityType),
              targetProvider
            );
          }
          const result: ConnectionChangedResultMessage = {
            type: 'CONNECTION_CHANGED_RESULT',
            requestId,
            ok: true,
          };
          socket.send(JSON.stringify(result));
        } catch (err) {
          if (!requestId) return;
          const result: ConnectionChangedResultMessage = {
            type: 'CONNECTION_CHANGED_RESULT',
            requestId,
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          };
          socket.send(JSON.stringify(result));
        }
      });
    });

    server.listen(port, host, () => {
      const url = `http://${host}:${port}`;
      highlight(`Visualizer available at ${url}`);
      console.log('  Press Ctrl+C to stop');
      if (shouldOpen) {
        openBrowser(url);
      }
    });

    process.once('SIGINT', shutdown);
  } catch (err) {
    error(`Visualizer failed: ${err}`);
    process.exit(1);
  }
}
