import { Registry, Asset, Conflict } from './types.js';
import { readJSON, writeJSON, fileExists, ensureDir } from '#shared/fs.js';
import { getRegistryPath, getRegistryDir } from '#shared/paths.js';
import { randomUUID } from 'crypto';

export class RegistryManager {
  private scope: 'user' | 'workspace';
  private registry: Registry | null = null;

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    this.scope = scope;
  }

  async load(): Promise<Registry> {
    const path = getRegistryPath(this.scope);

    if (await fileExists(path)) {
      try {
        this.registry = await readJSON<Registry>(path);
      } catch (err) {
        // If file is empty or invalid, fallback to empty registry
        this.registry = this.createDefaultRegistry();
      }
    } else {
      this.registry = this.createDefaultRegistry();
    }

    return this.registry;
  }

  async save(): Promise<void> {
    if (!this.registry) {
      throw new Error('Registry not loaded');
    }

    const dir = getRegistryDir(this.scope);
    await ensureDir(dir);

    const path = getRegistryPath(this.scope);
    await writeJSON(path, this.registry);
  }

  get(): Registry {
    if (!this.registry) {
      throw new Error('Registry not loaded');
    }
    return this.registry;
  }

  findAsset(name: string, type: string): Asset | undefined {
    if (!this.registry) return undefined;
    return this.registry.assets.find((a) => a.name === name && a.type === type);
  }

  addAsset(asset: Asset): void {
    if (!this.registry) {
      throw new Error('Registry not loaded');
    }
    this.registry.assets.push(asset);
  }

  updateAsset(id: string, updates: Partial<Asset>): void {
    if (!this.registry) {
      throw new Error('Registry not loaded');
    }
    const asset = this.registry.assets.find((a) => a.id === id);
    if (asset) {
      Object.assign(asset, updates);
    }
  }

  removeAsset(id: string): void {
    if (!this.registry) {
      throw new Error('Registry not loaded');
    }
    this.registry.assets = this.registry.assets.filter((a) => a.id !== id);
  }

  findConflict(assetName: string, type: string): Conflict | undefined {
    if (!this.registry) return undefined;
    return this.registry.conflicts.find((c) => c.asset_name === assetName && c.type === type);
  }

  addConflict(conflict: Conflict): void {
    if (!this.registry) {
      throw new Error('Registry not loaded');
    }
    this.registry.conflicts.push(conflict);
  }

  removeConflict(assetName: string, type: string): void {
    if (!this.registry) {
      throw new Error('Registry not loaded');
    }
    this.registry.conflicts = this.registry.conflicts.filter(
      (c) => !(c.asset_name === assetName && c.type === type)
    );
  }

  setScope(scope: 'user' | 'workspace'): void {
    this.scope = scope;
    if (this.registry) {
      this.registry.config.scope = scope;
    }
  }

  static generateId(): string {
    return randomUUID();
  }

  private createDefaultRegistry(): Registry {
    return {
      assets: [],
      conflicts: [],
      config: {
        scope: this.scope,
        version: '0.1.0',
      },
    };
  }
}
