import { createServer, IncomingMessage, ServerResponse } from 'http';
import { extname, join, resolve } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { Scanner } from '../../core/scanner.js';
import { RegistryManager } from '../../core/registry.js';
import { getInstalledAdapters } from '../../adapters/factory.js';
import { error, highlight, info, section, spacer } from '../../utils/cli-output.js';
import { Syncer } from '../../syncer/index.js';
import type {
  VisualizerConfiguration,
  VisualizerEntity,
  VisualizerEntityType,
} from '../../core/visualizer-types.js';

interface VisualizerOptions {
  scope?: string;
  port?: string;
  host?: string;
  noOpen?: boolean;
}

async function getEntityContent(
  scope: 'user' | 'workspace',
  type: VisualizerEntityType,
  name: string
): Promise<string | null> {
  const scanner = new Scanner(scope);
  await scanner.initialize();
  const discovered = await scanner.scanAllTools();
  const target = discovered.find((item) => mapType(item.type) === type && item.name === name);
  if (!target) return null;

  if (target.content) return target.content;

  try {
    return await readFile(target.path, 'utf-8');
  } catch {
    return null;
  }
}

function mapType(type: 'agent' | 'skill' | 'mcp' | 'context'): VisualizerEntityType {
  if (type === 'context') return 'instruction';
  return type;
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

  const providers = [
    { id: 'waslagenie', title: 'WaslaGenie', iconUrl: PROVIDER_ICONS.waslagenie, isHub: true },
    ...installed.map((adapter) => ({
      id: adapter.name,
      title: adapter.displayName,
      iconUrl: PROVIDER_ICONS[adapter.name],
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
    websocketUrl: '',
  };
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(text);
}

export async function visualizerCommand(options: VisualizerOptions): Promise<void> {
  try {
    const scope = (options.scope || 'workspace') as 'user' | 'workspace';
    const host = options.host || '127.0.0.1';
    const port = Number(options.port || 4072);
    const shouldOpen = options.noOpen !== true;

    section('Starting visualizer...');
    spacer();

    const visualizerDist = resolve(process.cwd(), 'src/visualizer/dist');
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

      if (req.method === 'GET' && url === '/api/config') {
        const freshConfig = await buildConfig(scope);
        freshConfig.websocketUrl = `ws://${host}:${port}`;
        sendJson(res, 200, freshConfig);
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/entity-content')) {
        const parsed = new URL(`http://${host}:${port}${url}`);
        const type = parsed.searchParams.get('type') as VisualizerEntityType | null;
        const name = parsed.searchParams.get('name');
        if (!type || !name) {
          sendJson(res, 400, { error: 'type and name are required' });
          return;
        }
        const content = await getEntityContent(scope, type, name);
        sendJson(res, 200, { content: content ?? '' });
        return;
      }

      if (req.method === 'POST' && url === '/api/shutdown') {
        sendJson(res, 200, { ok: true });
        setTimeout(shutdown, 50);
        return;
      }

      if (url === '/' || url === '/index.html') {
        const html = await readFile(join(visualizerDist, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      const staticPath = join(visualizerDist, url.replace(/^\//, ''));
      if (!staticPath.startsWith(visualizerDist) || !existsSync(staticPath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const payload = await readFile(staticPath);
      res.writeHead(200, { 'Content-Type': mimeType(staticPath) });
      res.end(payload);
    });

    const wss = new WebSocketServer({ server });
    wss.on('connection', (socket: WebSocket) => {
      socket.on('message', async (raw: RawData) => {
        try {
          const data = JSON.parse(raw.toString()) as {
            type?: string;
            payload?: {
              sourceEntity?: string;
              entityType?: VisualizerEntityType;
              sourceProvider?: string;
              targetProvider?: string;
              action?: 'ATTACH' | 'DETACH';
            };
          };

          if (data.type !== 'CONNECTION_CHANGED' || !data.payload) return;
          const { sourceEntity, entityType, sourceProvider, targetProvider, action } = data.payload;
          if (!sourceEntity || !entityType || !sourceProvider || !targetProvider || !action) {
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
        } catch {
          // Ignore invalid websocket messages from the client.
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
