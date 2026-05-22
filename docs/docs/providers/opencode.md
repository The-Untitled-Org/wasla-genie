---
id: opencode
title: OpenCode Configuration Guide
sidebar_label: OpenCode
---

# OpenCode Configuration Guide

This guide covers how to configure agents, MCPs, and skills for OpenCode when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to OpenCode's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for OpenCode

### Interacting with Skills and MCPs
- How to make skills available to agents in OpenCode
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how OpenCode configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How OpenCode exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in OpenCode

### Skill Discovery and Registration
- Skill locations scanned by OpenCode

### Extending Capabilities
- How skills augment agents in OpenCode

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for OpenCode

### Authentication Requirements
- How to authenticate OpenCode with AI models

### Environment Variables
- Key environment variables for OpenCode

### Limitations and Capabilities
- Specific edge cases for OpenCode (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for OpenCode"
}
```

### Sample Agent Definitions

```markdown
# OpenCode Agent
This is a sample agent for OpenCode.
```
