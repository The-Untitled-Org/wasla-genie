import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { DragEvent, MouseEvent } from 'react';
import type { VisualizerEntityType } from '#core/visualizer-types';

export type EntityInteractionPayload = {
  name: string;
  type: VisualizerEntityType;
  providerId: string;
};

export type ProviderCardData = {
  providerId: string;
  title: string;
  attachedByType: Record<VisualizerEntityType, string[]>;
  iconUrl?: string;
  isHub?: boolean;
  isInstalled?: boolean;
};

type ProviderCardProps = {
  data: ProviderCardData;
  onEntityDragStart: (payload: EntityInteractionPayload, event: DragEvent) => void;
  onEntityDrop: (targetProviderId: string, event: DragEvent) => void;
  onEntityDelete: (payload: EntityInteractionPayload) => void;
  onEntityClick: (payload: EntityInteractionPayload) => void;
};

const entityTypes = ['instruction', 'agent', 'skill', 'mcp'] as const;

function typeLabel(type: VisualizerEntityType): string {
  if (type === 'instruction') return 'Instructions';
  if (type === 'agent') return 'Agents';
  if (type === 'skill') return 'Skills';
  return 'MCPs';
}

export function ProviderCard({
  data,
  onEntityDragStart,
  onEntityDrop,
  onEntityDelete,
  onEntityClick,
}: ProviderCardProps) {
  const stopDeleteClick = (event: MouseEvent, payload: EntityInteractionPayload) => {
    event.stopPropagation();
    onEntityDelete(payload);
  };

  return (
    <Card
      variant="providerNode"
      className={[
        'provider-card',
        data.isHub ? 'provider-card-hub' : '',
        data.isInstalled === false ? 'provider-card-unavailable' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      elevation={0}
      onDragOver={(event) => {
        if (data.isInstalled === false) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={
        data.isInstalled === false ? undefined : (event) => onEntityDrop(data.providerId, event)
      }
    >
      <CardContent>
        <Stack direction="row" className="provider-node-header">
          <Stack direction="row" spacing={1} className="floating-inline">
            {data.iconUrl ? (
              <Avatar src={data.iconUrl} alt={data.title} className="provider-node-avatar" />
            ) : null}
            <Typography variant="h6">
              {data.title}
              {data.isInstalled === false ? ' (not installed)' : ''}
            </Typography>
          </Stack>
          <Box
            className={
              data.isInstalled === false
                ? 'provider-node-status provider-node-status-unavailable'
                : 'provider-node-status'
            }
          />
        </Stack>
        <Stack className="provider-groups">
          {entityTypes.map((type) => {
            const items = data.attachedByType[type] ?? [];
            if (!items.length) return null;
            return (
              <Stack key={type} className="provider-group">
                <Typography variant="overline" className="provider-group-title">
                  {typeLabel(type)}
                </Typography>
                <Stack direction="row" className="provider-chip-wrap">
                  {items.map((entity) => {
                    const payload = { name: entity, type, providerId: data.providerId };
                    return (
                      <Chip
                        key={`${type}-${entity}`}
                        size="small"
                        label={entity}
                        draggable={data.isInstalled !== false}
                        className={`entity-chip entity-chip-${type}`}
                        onDragStart={(event) => onEntityDragStart(payload, event)}
                        onDelete={
                          data.isHub || data.isInstalled === false
                            ? undefined
                            : (event) => stopDeleteClick(event, payload)
                        }
                        onClick={() => onEntityClick(payload)}
                      />
                    );
                  })}
                </Stack>
              </Stack>
            );
          })}
          {!Object.values(data.attachedByType).some((arr) => arr.length > 0) ? (
            <Typography variant="body2" color="text.secondary">
              No attached entities
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
