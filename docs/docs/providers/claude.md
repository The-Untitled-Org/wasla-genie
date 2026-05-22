---
id: claude
title: Claude Configuration Guide
sidebar_label: Claude
---

# Claude Configuration Guide

This guide covers how to configure agents, MCPs, and skills for Claude when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to Claude's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for Claude

### Interacting with Skills and MCPs
- How to make skills available to agents in Claude
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how Claude configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How Claude exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in Claude

### Skill Discovery and Registration
- Skill locations scanned by Claude

### Extending Capabilities
- How skills augment agents in Claude

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for Claude

### Authentication Requirements
- How to authenticate Claude with AI models

### Environment Variables
- Key environment variables for Claude

### Limitations and Capabilities
- Specific edge cases for Claude (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for Claude"
}
```

### Sample Agent Definitions

```markdown
# Claude Agent
This is a sample agent for Claude.
```
