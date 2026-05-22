---
id: github-cli
title: GitHub CLI Configuration Guide
sidebar_label: GitHub CLI
---

# GitHub CLI Configuration Guide

This guide covers how to configure agents, MCPs, and skills for GitHub CLI when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to GitHub CLI's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for GitHub CLI

### Interacting with Skills and MCPs
- How to make skills available to agents in GitHub CLI
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how GitHub CLI configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How GitHub CLI exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in GitHub CLI

### Skill Discovery and Registration
- Skill locations scanned by GitHub CLI

### Extending Capabilities
- How skills augment agents in GitHub CLI

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for GitHub CLI

### Authentication Requirements
- How to authenticate GitHub CLI with AI models

### Environment Variables
- Key environment variables for GitHub CLI

### Limitations and Capabilities
- Specific edge cases for GitHub CLI (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for GitHub CLI"
}
```

### Sample Agent Definitions

```markdown
# GitHub CLI Agent
This is a sample agent for GitHub CLI.
```
