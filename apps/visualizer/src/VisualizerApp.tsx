import { useCallback, useEffect, useLayoutEffect, useRef, useState, type DragEvent } from 'react';
import {
  Alert,
  Box,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {
  ProviderCard,
  type EntityInteractionPayload,
  type ProviderCardData,
} from './components/ProviderCard';
import { FloatingActions } from './components/FloatingActions';
import { useVisualizerSocket } from './hooks/useVisualizerSocket';
import type {
  ConnectionChangedMessage,
  VisualizerConfiguration,
  VisualizerEntity,
  VisualizerEntityType,
  VisualizerProvider,
} from '#core/visualizer-types';

const dndMime = 'application/wasla-provider-entity';
const orbitPositions = [
  'north-west',
  'north',
  'north-east',
  'west',
  'east',
  'south-west',
  'south',
  'south-east',
] as const;

type ProviderGroups = Record<VisualizerEntityType, string[]>;
type ConnectorLine = { providerId: string; x1: number; y1: number; x2: number; y2: number };

function flattenEntities(config: VisualizerConfiguration): VisualizerEntity[] {
  return [
    ...config.entities.instructions,
    ...config.entities.agents,
    ...config.entities.skills,
    ...config.entities.mcps,
  ];
}

function emptyGroups(): ProviderGroups {
  return { instruction: [], agent: [], skill: [], mcp: [] };
}

function buildAttachedByProvider(config: VisualizerConfiguration) {
  const entityById = new Map<string, VisualizerEntity>(
    flattenEntities(config).map((entity) => [entity.id, entity])
  );
  const map = new Map<string, ProviderGroups>();
  const ensure = (providerId: string) => {
    const existing = map.get(providerId);
    if (existing) return existing;
    const created = emptyGroups();
    map.set(providerId, created);
    return created;
  };

  for (const connection of config.connections) {
    const entity = entityById.get(connection.entityId);
    if (!entity) continue;
    const groups = ensure(connection.providerId);
    if (!groups[entity.type].includes(entity.name)) {
      groups[entity.type].push(entity.name);
    }
  }

  const hub = config.providers.find((provider) => provider.isHub);
  if (hub) {
    const hubGroups = ensure(hub.id);
    for (const entity of entityById.values()) {
      if (!hubGroups[entity.type].includes(entity.name)) {
        hubGroups[entity.type].push(entity.name);
      }
    }
  }

  return map;
}

function cardData(
  provider: VisualizerProvider,
  groups: Map<string, ProviderGroups>
): ProviderCardData {
  return {
    providerId: provider.id,
    title: provider.title,
    attachedByType: groups.get(provider.id) ?? emptyGroups(),
    iconUrl: provider.iconUrl,
    isHub: provider.isHub,
    isInstalled: provider.isInstalled,
  };
}

function Workspace({
  config,
  mode,
  onToggleMode,
  onRefreshConfig,
}: {
  config: VisualizerConfiguration;
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  onRefreshConfig: () => Promise<void>;
}) {
  const { connected, send } = useVisualizerSocket(config.websocketUrl);
  const [attachedByProvider, setAttachedByProvider] = useState(() =>
    buildAttachedByProvider(config)
  );
  const [selectedContent, setSelectedContent] = useState({
    open: false,
    title: '',
    body: '',
  });
  const [isClosed, setIsClosed] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hub = config.providers.find((provider) => provider.isHub);
  const providers = config.providers.filter((provider) => !provider.isHub);

  useEffect(() => {
    setAttachedByProvider(buildAttachedByProvider(config));
  }, [config]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !hub) return;

    const updateLines = () => {
      const stageRect = stage.getBoundingClientRect();
      const hubSlot = stage.querySelector<HTMLElement>(`[data-provider-slot="${hub.id}"]`);
      if (!hubSlot) return;
      const hubRect = hubSlot.getBoundingClientRect();
      const x1 = hubRect.left - stageRect.left + hubRect.width / 2;
      const y1 = hubRect.top - stageRect.top + hubRect.height / 2;

      setConnectorLines(
        providers.flatMap((provider) => {
          const slot = stage.querySelector<HTMLElement>(`[data-provider-slot="${provider.id}"]`);
          if (!slot) return [];
          const rect = slot.getBoundingClientRect();
          return [
            {
              providerId: provider.id,
              x1,
              y1,
              x2: rect.left - stageRect.left + rect.width / 2,
              y2: rect.top - stageRect.top + rect.height / 2,
            },
          ];
        })
      );
    };

    const observer = new ResizeObserver(updateLines);
    observer.observe(stage);
    for (const slot of stage.querySelectorAll<HTMLElement>('[data-provider-slot]')) {
      observer.observe(slot);
    }
    window.addEventListener('resize', updateLines);
    updateLines();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLines);
    };
  }, [attachedByProvider, config.providers]);

  const mutateProviderEntity = useCallback(
    (providerId: string, type: VisualizerEntityType, name: string, action: 'add' | 'remove') => {
      setAttachedByProvider((previous) => {
        const next = new Map(previous);
        const groups = next.get(providerId) ?? emptyGroups();
        const current = groups[type];
        const values =
          action === 'add'
            ? current.includes(name)
              ? current
              : [...current, name]
            : current.filter((value) => value !== name);
        next.set(providerId, { ...groups, [type]: values });
        return next;
      });
    },
    []
  );

  const onEntityDragStart = useCallback((payload: EntityInteractionPayload, event: DragEvent) => {
    event.stopPropagation();
    event.dataTransfer.setData(dndMime, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  const onEntityDrop = useCallback(
    (targetProviderId: string, event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const raw = event.dataTransfer.getData(dndMime);
      if (!raw) return;
      const payload = JSON.parse(raw) as EntityInteractionPayload;
      if (payload.providerId === targetProviderId || targetProviderId === hub?.id) return;
      const target = config.providers.find((provider) => provider.id === targetProviderId);
      if (target?.isInstalled === false) return;

      mutateProviderEntity(targetProviderId, payload.type, payload.name, 'add');
      setMutationError(null);
      void send({
        sourceEntity: payload.name,
        entityType: payload.type,
        sourceProvider: payload.providerId,
        targetProvider: targetProviderId,
        action: 'ATTACH',
      })
        .then(onRefreshConfig)
        .catch((error: unknown) => {
          mutateProviderEntity(targetProviderId, payload.type, payload.name, 'remove');
          setMutationError(error instanceof Error ? error.message : String(error));
        });
    },
    [config.providers, hub?.id, mutateProviderEntity, onRefreshConfig, send]
  );

  const onEntityDelete = useCallback(
    (payload: EntityInteractionPayload) => {
      mutateProviderEntity(payload.providerId, payload.type, payload.name, 'remove');
      setMutationError(null);
      void send({
        sourceEntity: payload.name,
        entityType: payload.type,
        sourceProvider: payload.providerId,
        targetProvider: payload.providerId,
        action: 'DETACH',
      })
        .then(onRefreshConfig)
        .catch((error: unknown) => {
          mutateProviderEntity(payload.providerId, payload.type, payload.name, 'add');
          setMutationError(error instanceof Error ? error.message : String(error));
        });
    },
    [mutateProviderEntity, onRefreshConfig, send]
  );

  const onEntityClick = useCallback(async (payload: EntityInteractionPayload) => {
    try {
      const query = `type=${encodeURIComponent(payload.type)}&name=${encodeURIComponent(
        payload.name
      )}&provider=${encodeURIComponent(payload.providerId)}`;
      const response = await fetch(`/api/entity-content?${query}`);
      if (!response.ok) throw new Error('Failed');
      const data = (await response.json()) as { content?: string };
      setSelectedContent({
        open: true,
        title: `${payload.type}: ${payload.name}`,
        body: data.content || 'No content found.',
      });
    } catch {
      setSelectedContent({
        open: true,
        title: `${payload.type}: ${payload.name}`,
        body: 'Unable to load content.',
      });
    }
  }, []);

  const closeVisualizer = useCallback(() => {
    void fetch('/api/shutdown', { method: 'POST', keepalive: true });
    window.close();
    window.setTimeout(() => setIsClosed(true), 100);
  }, []);

  const handlers = {
    onEntityDragStart,
    onEntityDrop,
    onEntityDelete,
    onEntityClick,
  };

  if (isClosed) {
    return (
      <Box className="workspace-closed">
        <Card variant="glassPanel" className="workspace-closed-card">
          <Stack spacing={1}>
            <Typography variant="h6">Visualizer closed</Typography>
            <Typography variant="body2" color="text.secondary">
              The local server has stopped. You can close this tab.
            </Typography>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="workspace-shell">
      <FloatingActions
        isDark={mode === 'dark'}
        connected={connected}
        onToggleTheme={onToggleMode}
        onRefresh={() => void onRefreshConfig()}
        onShutdown={closeVisualizer}
      />
      {mutationError ? (
        <Alert
          severity="error"
          onClose={() => setMutationError(null)}
          sx={{ position: 'absolute', top: 76, right: 20, zIndex: 12, maxWidth: 520 }}
        >
          {mutationError}
        </Alert>
      ) : null}
      <Box ref={stageRef} className="workspace-stage">
        <svg className="provider-connectors" aria-hidden="true">
          {connectorLines.map((line) => (
            <line key={line.providerId} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
        </svg>
        {hub ? (
          <Box className="provider-slot provider-slot-center" data-provider-slot={hub.id}>
            <ProviderCard data={cardData(hub, attachedByProvider)} {...handlers} />
          </Box>
        ) : null}
        {providers.map((provider, index) => {
          const position = orbitPositions[index];
          if (!position) return null;
          return (
            <Box
              key={provider.id}
              className={`provider-slot provider-slot-${position}`}
              data-provider-slot={provider.id}
            >
              <ProviderCard data={cardData(provider, attachedByProvider)} {...handlers} />
            </Box>
          );
        })}
      </Box>
      <Dialog
        open={selectedContent.open}
        onClose={() => setSelectedContent((previous) => ({ ...previous, open: false }))}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{selectedContent.title}</DialogTitle>
        <DialogContent>
          <Box component="pre" className="entity-content-preview">
            {selectedContent.body}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export function VisualizerApp({
  mode,
  onToggleMode,
}: {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}) {
  const [config, setConfig] = useState<VisualizerConfiguration | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoadError(null);
    const injected = (window as Window & { __WASLA_VISUALIZER_CONFIG__?: VisualizerConfiguration })
      .__WASLA_VISUALIZER_CONFIG__;
    if (injected) {
      setConfig(injected);
      return;
    }
    try {
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('Config fetch failed');
      setConfig((await response.json()) as VisualizerConfiguration);
    } catch {
      setConfig(null);
      setLoadError('Cannot load workspace config. Start with: waslagenie ui');
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  if (!config) {
    return (
      <Box className="workspace-loading">
        <Stack spacing={0.75} className="loading-state">
          <Typography variant="body1">{loadError ?? 'Loading workspace config...'}</Typography>
          {loadError ? (
            <Typography variant="caption" color="text.secondary">
              No demo data is used in this view.
            </Typography>
          ) : null}
        </Stack>
      </Box>
    );
  }

  return (
    <Workspace
      config={config}
      mode={mode}
      onToggleMode={onToggleMode}
      onRefreshConfig={fetchConfig}
    />
  );
}
