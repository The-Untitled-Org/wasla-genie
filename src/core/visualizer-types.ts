export type VisualizerEntityType = 'instruction' | 'agent' | 'skill' | 'mcp';
export type VisualizerProviderId = string;

export interface VisualizerEntity {
  id: string;
  name: string;
  type: VisualizerEntityType;
}

export interface VisualizerProvider {
  id: VisualizerProviderId;
  title: string;
  iconUrl?: string;
  isHub?: boolean;
}

export interface VisualizerConnection {
  entityId: string;
  providerId: VisualizerProviderId;
}

export interface VisualizerConfiguration {
  providers: VisualizerProvider[];
  entities: {
    instructions: VisualizerEntity[];
    agents: VisualizerEntity[];
    skills: VisualizerEntity[];
    mcps: VisualizerEntity[];
  };
  connections: VisualizerConnection[];
  websocketUrl?: string;
}

export interface ConnectionChangedMessage {
  type: 'CONNECTION_CHANGED';
  payload: {
    sourceEntity: string;
    entityType: VisualizerEntityType;
    sourceProvider: VisualizerProviderId;
    targetProvider: VisualizerProviderId;
    action: 'ATTACH' | 'DETACH';
  };
}
