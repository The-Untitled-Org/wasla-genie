---
id: gemini
title: Gemini Configuration Guide
sidebar_label: Gemini
---

# Gemini Configuration Guide

This guide covers how to configure agents, MCPs, and skills for Gemini when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents
- Define agents according to Gemini's specific format
- Agents typically live in configuration files or a dedicated `.agents` directory

### Agent Lifecycle and Activation
- Describes how agents are spawned and destroyed
- Memory and context limitations for Gemini

### Interacting with Skills and MCPs
- How to make skills available to agents in Gemini
- Tool calling formats

### Configuration Locations
- Workspace: `./`
- User: `~/`

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration
- Describe how Gemini configures MCP servers (e.g. settings file, env vars)

### MCP Integration with Agents
- How Gemini exposes MCP tools to agents

### MCP Communication Protocols
- Default transport mechanisms (stdio, sse)

## 3. Skills Integration

### Skill Installation and Management
- How to install skills in Gemini

### Skill Discovery and Registration
- Skill locations scanned by Gemini

### Extending Capabilities
- How skills augment agents in Gemini

## 4. Provider-Specific Details

### Installation / Setup
- Setup steps for Gemini

### Authentication Requirements
- How to authenticate Gemini with AI models

### Environment Variables
- Key environment variables for Gemini

### Limitations and Capabilities
- Specific edge cases for Gemini (e.g. token limits, tool call latency)

## 5. Examples

### Working Example Configurations

```json
{
  "example": "configuration for Gemini"
}
```

### Sample Agent Definitions

```markdown
# Gemini Agent
This is a sample agent for Gemini.
```
