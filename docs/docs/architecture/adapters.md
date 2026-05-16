---
sidebar_position: 6
---

# Writing an Adapter

WaslaGenie uses an adapter pattern to support different AI orchestrators. Each tool needs an adapter that knows:

1. Where configuration directories live
2. What asset types it supports
3. How to write stub files in its native format
4. How to install WaslaGenie as a native skill

## Adapter Interface

```typescript
export interface WaslaGenieAdapter {
  name: string;
  configDir: string;
  supportedAssets: AssetType[];
  
  readAsset(assetPath: string): Promise<Asset>;
  writeStub(stub: Stub): Promise<void>;
  installSkill(): Promise<void>;
}
```

## Implementing an Adapter

1. Create a new adapter file in `src/architecture/adapters/`
2. Implement the `WaslaGenieAdapter` interface
3. Define tool-specific paths and formats
4. Handle stub writing in the tool's native format
5. Register the adapter in the factory

## Example: Adding Support for a New Tool

See the existing adapters (Claude Code, Gemini CLI, OpenCode) for implementation examples in `src/architecture/adapters/`.

## Stub Formats

Different tools may require different stub formats:

- **Markdown-based tools**: Use frontmatter + stub marker
- **JSON-based tools**: Use JSON with stub metadata
- **Custom formats**: Adapt to the tool's native format

For more information, see [How Stubs Work](./how-stubs-work.md).
