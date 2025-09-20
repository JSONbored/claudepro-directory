import { NextResponse } from 'next/server';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400; // 4 hours

// Helper function to transform content with type and URL
function transformContent<T extends { slug: string }>(
  content: T[],
  type: string,
  category: string
): (T & { type: string; url: string })[] {
  return content.map((item) => ({
    ...item,
    type,
    url: `https://claudepro.directory/${category}/${item.slug}`,
  }));
}

export async function GET() {
  try {
    const transformedAgents = transformContent(agents, 'agent', 'agents');
    const transformedMcp = transformContent(mcp, 'mcp', 'mcp');
    const transformedRules = transformContent(rules, 'rule', 'rules');
    const transformedCommands = transformContent(commands, 'command', 'commands');
    const transformedHooks = transformContent(hooks, 'hook', 'hooks');

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
  } catch (error) {
    console.error('API Error in all-configurations route:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate configurations dataset',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
