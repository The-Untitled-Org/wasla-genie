---
id: openclaw
title: OpenClaw Configuration Guide
sidebar_label: OpenClaw
---

# OpenClaw Configuration Guide

This guide covers how to configure agents, MCPs, and skills for OpenClaw when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to OpenClaw's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for OpenClaw

### Interacting with Skills and MCPs
- How to make skills available to agents in OpenClaw
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how OpenClaw configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How OpenClaw exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in OpenClaw

### Skill Discovery and Registration
- Skill locations scanned by OpenClaw

### Extending Capabilities
- How skills augment agents in OpenClaw

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for OpenClaw

### Authentication Requirements
- How to authenticate OpenClaw with AI models

### Environment Variables
- Key environment variables for OpenClaw

### Limitations and Capabilities
- Specific edge cases for OpenClaw (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for OpenClaw"
}
```

### Sample Agent Definitions

```markdown
# OpenClaw Agent
This is a sample agent for OpenClaw.
```
