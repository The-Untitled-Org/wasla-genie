# Tests Directory

This directory contains all tests for the WaslaGenie project, organized by test type.

## Structure

```
tests/
├── unit/                 # Unit tests for individual modules
├── integration/          # Integration tests for feature workflows
└── validation/          # E2E validation tests for complete scenarios
```

## Test Categories

### Unit Tests (`tests/unit/`)

Unit tests focus on individual modules in isolation:

- **registry.test.ts** — Tests for RegistryManager (add, retrieve, update assets)
- **scanner.test.ts** — Tests for Scanner (tool detection, asset classification, conflict detection)
- **syncer.test.ts** — Tests for Syncer initialization and core sync logic

**Run unit tests:**
```bash
npm run test:unit
```

### Integration Tests (`tests/integration/`)

Integration tests verify modules work together correctly:

- **sync.test.ts** — Tests complete sync workflow (scan → conflict resolution → stub writing)
- **adapters.test.ts** — Tests adapter initialization and tool detection across all adapters

**Run integration tests:**
```bash
npm run test:integration
```

### Validation Tests (`tests/validation/`)

Validation tests verify end-to-end scenarios and user-facing workflows:

- **e2e-workflow.test.ts** — Tests complete WaslaGenie workflows:
  - Stub markers are correctly written and detected
  - Orphaned assets are marked with `.bak` status
  - Conflict resolution uses "latest is greatest" strategy
  - Registry persists across runs
  - Scope (user vs workspace) is respected

**Run validation tests:**
```bash
npm run test:validation
```

## Running All Tests

```bash
npm test
```

Or watch mode:
```bash
npm run test:watch
```

## Test Coverage

```bash
npm run test:coverage
```

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('MyModule', () => {
  it('should do something', () => {
    // Arrange
    const input = 'value';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Feature Integration', () => {
  beforeAll(async () => {
    // Setup shared resources
  });

  it('should work across modules', async () => {
    // Test interactions between modules
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

## Key Testing Patterns

### Mocking Registry

```typescript
import { RegistryManager } from '../../src/core/registry';

const registry = new RegistryManager();
registry.addAsset(mockAsset);
```

### Mocking Scanner

```typescript
import { Scanner } from '../../src/core/scanner';

const scanner = new Scanner('workspace');
const discovered = await scanner.scanAllTools();
```

### Testing Sync Workflows

```typescript
const syncer = new Syncer(registry, scanner, 'workspace');
const result = await syncer.sync(false); // non-interactive
```

## Important Notes

- **Isolation:** Each test should be independent and not rely on state from other tests
- **Cleanup:** Always clean up temporary files and state after tests
- **Mocking:** Mock external dependencies; only test the module's logic
- **Test Data:** Use realistic data that mirrors actual WaslaGenie usage
- **Assertions:** Use specific assertions (not just `toBeTruthy()`)

## Future Test Improvements

- [ ] Add tests for CLI commands
- [ ] Add tests for daemon/watcher
- [ ] Add performance/stress tests
- [ ] Add tests for edge cases (permission errors, missing directories)
- [ ] Add snapshot tests for output formatting
