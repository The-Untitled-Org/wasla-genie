---
id: github-copilot
title: GitHub Copilot Configuration Guide
sidebar_label: GitHub Copilot
---

# GitHub Copilot Configuration Guide

This guide covers how to configure agents, MCPs, and skills for GitHub Copilot when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to GitHub Copilot's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for GitHub Copilot

### Interacting with Skills and MCPs
- How to make skills available to agents in GitHub Copilot
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how GitHub Copilot configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How GitHub Copilot exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in GitHub Copilot

### Skill Discovery and Registration
- Skill locations scanned by GitHub Copilot

### Extending Capabilities
- How skills augment agents in GitHub Copilot

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for GitHub Copilot

### Authentication Requirements
- How to authenticate GitHub Copilot with AI models

### Environment Variables
- Key environment variables for GitHub Copilot

### Limitations and Capabilities
- Specific edge cases for GitHub Copilot (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for GitHub Copilot"
}
```

### Sample Agent Definitions

```markdown
# GitHub Copilot Agent
This is a sample agent for GitHub Copilot.
```
