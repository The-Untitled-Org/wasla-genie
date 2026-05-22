---
id: cursor
title: Cursor Configuration Guide
sidebar_label: Cursor
---

# Cursor Configuration Guide

This guide covers how to configure agents, MCPs, and skills for Cursor when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to Cursor's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for Cursor

### Interacting with Skills and MCPs
- How to make skills available to agents in Cursor
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how Cursor configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How Cursor exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in Cursor

### Skill Discovery and Registration
- Skill locations scanned by Cursor

### Extending Capabilities
- How skills augment agents in Cursor

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for Cursor

### Authentication Requirements
- How to authenticate Cursor with AI models

### Environment Variables
- Key environment variables for Cursor

### Limitations and Capabilities
- Specific edge cases for Cursor (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for Cursor"
}
```

### Sample Agent Definitions

```markdown
# Cursor Agent
This is a sample agent for Cursor.
```
