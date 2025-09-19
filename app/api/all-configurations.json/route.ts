import { NextResponse } from 'next/server';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400; // 4 hours

export async function GET() {
  const transformedAgents = agents.map((agent) => ({
    ...agent,
    type: 'agent',
    url: `https://claudepro.directory/agents/${agent.slug}`,
  }));

  const transformedMcp = mcp.map((server) => ({
    ...server,
    type: 'mcp',
    url: `https://claudepro.directory/mcp/${server.slug}`,
  }));

  const transformedRules = rules.map((rule) => ({
    ...rule,
    type: 'rule',
    url: `https://claudepro.directory/rules/${rule.slug}`,
  }));

  const transformedCommands = commands.map((command) => ({
    ...command,
    type: 'command',
    url: `https://claudepro.directory/commands/${command.slug}`,
  }));

  const transformedHooks = hooks.map((hook) => ({
    ...hook,
    type: 'hook',
    url: `https://claudepro.directory/hooks/${hook.slug}`,
  }));

  const allConfigurations = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Claude Pro Directory - All Configurations',
    description: 'Complete database of Claude AI configurations',
    license: 'MIT',
    lastUpdated: new Date().toISOString(),
    statistics: {
      totalConfigurations:
        transformedAgents.length +
        transformedMcp.length +
        transformedRules.length +
        transformedCommands.length +
        transformedHooks.length,
      agents: transformedAgents.length,
      mcp: transformedMcp.length,
      rules: transformedRules.length,
      commands: transformedCommands.length,
      hooks: transformedHooks.length,
    },
    data: {
      agents: transformedAgents,
      mcp: transformedMcp,
      rules: transformedRules,
      commands: transformedCommands,
      hooks: transformedHooks,
    },
    endpoints: {
      agents: 'https://claudepro.directory/api/agents.json',
      mcp: 'https://claudepro.directory/api/mcp.json',
      rules: 'https://claudepro.directory/api/rules.json',
      commands: 'https://claudepro.directory/api/commands.json',
      hooks: 'https://claudepro.directory/api/hooks.json',
    },
  };

  return NextResponse.json(allConfigurations, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
