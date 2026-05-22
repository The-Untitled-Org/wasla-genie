---
id: vscode
title: VS Code Configuration Guide
sidebar_label: VS Code
---

# VS Code Configuration Guide

This guide covers how to configure agents, MCPs, and skills for VS Code when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to VS Code's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for VS Code

### Interacting with Skills and MCPs
- How to make skills available to agents in VS Code
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how VS Code configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How VS Code exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in VS Code

### Skill Discovery and Registration
- Skill locations scanned by VS Code

### Extending Capabilities
- How skills augment agents in VS Code

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for VS Code

### Authentication Requirements
- How to authenticate VS Code with AI models

### Environment Variables
- Key environment variables for VS Code

### Limitations and Capabilities
- Specific edge cases for VS Code (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for VS Code"
}
```

### Sample Agent Definitions

```markdown
# VS Code Agent
This is a sample agent for VS Code.
```
