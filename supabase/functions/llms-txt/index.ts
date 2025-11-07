/**
 * LLMs.txt Edge Function - Unified Router
 * Single edge function handling all llms.txt patterns via query parameters
 *
 * Performance optimizations:
 * - Singleton Supabase client (reused across requests)
 * - Direct TEXT return from RPC functions (no JSONB parsing)
 * - Single RPC call per request
 * - Minimal egress (pre-formatted output from database)
 * - Rate limiting headers for API consumers
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
  publicCorsHeaders,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY');
}

// Singleton Supabase client - reused across all requests for optimal performance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_CATEGORIES = [
  'agents',
  'commands',
  'hooks',
  'mcp',
  'rules',
  'skills',
  'statuslines',
  'collections',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');
    const slug = url.searchParams.get('slug');
    const tool = url.searchParams.get('tool');

    // Route to appropriate RPC function based on type parameter
    let content: string | null = null;

    switch (type) {
      case 'sitewide': {
        // /llms.txt - Site-wide index
        const { data, error } = await supabase.rpc('generate_sitewide_llms_txt');
        if (error) {
          console.error('RPC error (sitewide):', error);
          return errorResponse(error, 'generate_sitewide_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      case 'category': {
        // /[category]/llms.txt - Category listing
        if (!category) {
          return badRequestResponse('Missing required parameter: category', getCorsHeaders);
        }
        if (!VALID_CATEGORIES.includes(category)) {
          return badRequestResponse(`Invalid category: ${category}`, getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_category_llms_txt', {
          p_category: category,
        });
        if (error) {
          console.error('RPC error (category):', error);
          return errorResponse(error, 'generate_category_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      case 'item': {
        // /[category]/[slug]/llms.txt - Individual item (existing function returns JSONB)
        if (!category || !slug) {
          return badRequestResponse(
            'Missing required parameters: category and slug',
            getCorsHeaders
          );
        }
        if (!VALID_CATEGORIES.includes(category)) {
          return badRequestResponse(`Invalid category: ${category}`, getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_llms_txt_content', {
          p_category: category,
          p_slug: slug,
        });

        if (error) {
          console.error('RPC error (item):', error);
          return errorResponse(error, 'generate_llms_txt_content', getCorsHeaders);
        }

        if (!data) {
          return new Response('Content not found', {
            status: 404,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store, must-revalidate',
              ...getCorsHeaders,
            },
          });
        }

        // Format JSONB response to plain text with full content expansion
        const itemData = data as {
          slug: string;
          title: string;
          description: string;
          category: string;
          tags?: string[];
          author?: string;
          date_added?: string;
          url: string;
          content?: string;
          detailed_content?: string;
          features?: string[];
          use_cases?: string[];
          examples?: Array<{ title: string; description?: string; code: string; language?: string }>;
          metadata?: Record<string, unknown>;
        };

        const sections: string[] = [];
        sections.push(`# ${itemData.title}\n`);
        sections.push(`${itemData.description}\n`);
        sections.push('---\n');

        // Metadata section
        sections.push('## Metadata\n');
        sections.push(`**Title:** ${itemData.title}`);
        sections.push(`**Category:** ${itemData.category}`);
        if (itemData.author) sections.push(`**Author:** ${itemData.author}`);
        if (itemData.date_added) {
          const date = new Date(itemData.date_added);
          sections.push(
            `**Added:** ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          );
        }
        if (itemData.tags && itemData.tags.length > 0) {
          sections.push(`**Tags:** ${itemData.tags.join(', ')}`);
        }
        sections.push(`**URL:** ${SITE_URL}/${itemData.category}/${itemData.slug}\n`);

        // Overview
        sections.push('## Overview\n');
        sections.push(`${itemData.description}\n`);

        // Main content
        if (itemData.detailed_content) {
          sections.push('## Content\n');
          sections.push(itemData.detailed_content);
          sections.push('');
        } else if (itemData.content) {
          sections.push('## Content\n');
          sections.push(itemData.content);
          sections.push('');
        }

        // Features
        if (itemData.features && itemData.features.length > 0) {
          sections.push('## Features\n');
          for (const feature of itemData.features) {
            sections.push(`- ${feature}`);
          }
          sections.push('');
        }

        // Use Cases
        if (itemData.use_cases && itemData.use_cases.length > 0) {
          sections.push('## Use Cases\n');
          for (const useCase of itemData.use_cases) {
            sections.push(`- ${useCase}`);
          }
          sections.push('');
        }

        // Examples
        if (itemData.examples && itemData.examples.length > 0) {
          sections.push('## Examples\n');
          for (const example of itemData.examples) {
            sections.push(`### ${example.title}\n`);
            if (example.description) {
              sections.push(`${example.description}\n`);
            }
            sections.push('```' + (example.language || 'plaintext'));
            sections.push(example.code);
            sections.push('```\n');
          }
        }

        // Metadata sections (different per category)
        if (itemData.metadata) {
          const meta = itemData.metadata as Record<string, unknown>;

          // Installation (mcp, commands, hooks, skills, statuslines)
          if (meta.installation) {
            sections.push('## Installation\n');
            const inst = meta.installation as Record<string, unknown>;
            if (inst.claudeCode && typeof inst.claudeCode === 'object') {
              const cc = inst.claudeCode as { steps?: string[] };
              if (cc.steps && Array.isArray(cc.steps)) {
                sections.push('### Claude Code\n');
                for (const step of cc.steps) {
                  sections.push(`${step}`);
                }
                sections.push('');
              }
            }
            if (inst.claudeDesktop && typeof inst.claudeDesktop === 'object') {
              const cd = inst.claudeDesktop as { steps?: string[]; configPath?: Record<string, string> };
              if (cd.steps && Array.isArray(cd.steps)) {
                sections.push('### Claude Desktop\n');
                for (const step of cd.steps) {
                  sections.push(`${step}`);
                }
                if (cd.configPath) {
                  sections.push('\n**Config Paths:**');
                  for (const [os, path] of Object.entries(cd.configPath)) {
                    sections.push(`- ${os}: \`${path}\``);
                  }
                }
                sections.push('');
              }
            }
          }

          // Configuration (most categories)
          if (meta.configuration) {
            sections.push('## Configuration\n');
            sections.push('```json');
            sections.push(JSON.stringify(meta.configuration, null, 2));
            sections.push('```\n');
          }

          // Troubleshooting (most categories)
          if (meta.troubleshooting && Array.isArray(meta.troubleshooting)) {
            sections.push('## Troubleshooting\n');
            for (const item of meta.troubleshooting as Array<{ issue: string; solution: string }>) {
              sections.push(`### ${item.issue}\n`);
              sections.push(`${item.solution}\n`);
            }
          }

          // Collections-specific
          if (meta.items && Array.isArray(meta.items)) {
            sections.push(`## Collection Items (${(meta.items as unknown[]).length})\n`);
            if (meta.installation_order && Array.isArray(meta.installation_order)) {
              sections.push('**Installation Order:**');
              for (let i = 0; i < (meta.installation_order as string[]).length; i++) {
                sections.push(`${i + 1}. ${(meta.installation_order as string[])[i]}`);
              }
              sections.push('');
            }
          }

          // MCP-specific
          if (meta.permissions && Array.isArray(meta.permissions)) {
            sections.push(`**Permissions:** ${(meta.permissions as string[]).join(', ')}\n`);
          }
          if (meta.requires_auth !== undefined) {
            sections.push(`**Requires Authentication:** ${meta.requires_auth ? 'Yes' : 'No'}\n`);
          }
          if (meta.security && Array.isArray(meta.security)) {
            sections.push('**Security Notes:**');
            for (const note of meta.security as string[]) {
              sections.push(`- ${note}`);
            }
            sections.push('');
          }

          // Skills-specific
          if (meta.requirements && typeof meta.requirements === 'object') {
            sections.push('## Requirements\n');
            sections.push('```json');
            sections.push(JSON.stringify(meta.requirements, null, 2));
            sections.push('```\n');
          }

          // Guides-specific
          if (meta.difficulty) {
            sections.push(`**Difficulty:** ${meta.difficulty}\n`);
          }
          if (meta.readingTime) {
            sections.push(`**Reading Time:** ${meta.readingTime}\n`);
          }
        }

        sections.push('---\n');
        sections.push(`Source: Claude Pro Directory`);
        sections.push(`Website: ${SITE_URL}`);
        sections.push(`URL: ${SITE_URL}/${itemData.category}/${itemData.slug}\n`);
        sections.push('This content is optimized for Large Language Models (LLMs).');
        sections.push('For full formatting and interactive features, visit the website.');

        content = sections.join('\n');
        break;
      }

      case 'changelog-index': {
        // /changelog/llms.txt - Changelog index
        const { data, error } = await supabase.rpc('generate_changelog_llms_txt');
        if (error) {
          console.error('RPC error (changelog-index):', error);
          return errorResponse(error, 'generate_changelog_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      case 'changelog-entry': {
        // /changelog/[slug]/llms.txt - Individual changelog entry
        if (!slug) {
          return badRequestResponse('Missing required parameter: slug', getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_changelog_entry_llms_txt', {
          p_slug: slug,
        });
        if (error) {
          console.error('RPC error (changelog-entry):', error);
          return errorResponse(error, 'generate_changelog_entry_llms_txt', getCorsHeaders);
        }
        if (!data) {
          return new Response('Changelog entry not found', {
            status: 404,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store, must-revalidate',
              ...getCorsHeaders,
            },
          });
        }
        content = data;
        break;
      }

      case 'tool': {
        // /tools/[tool]/llms.txt - Tool documentation
        if (!tool) {
          return badRequestResponse('Missing required parameter: tool', getCorsHeaders);
        }
        if (tool !== 'config-recommender') {
          return badRequestResponse(`Invalid tool: ${tool}`, getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_tool_llms_txt', {
          p_tool_name: tool,
        });
        if (error) {
          console.error('RPC error (tool):', error);
          return errorResponse(error, 'generate_tool_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      default:
        return badRequestResponse(
          'Missing or invalid type parameter. Valid types: sitewide, category, item, changelog-index, changelog-entry, tool',
          getCorsHeaders
        );
    }

    if (!content) {
      return new Response('Content not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
          ...getCorsHeaders,
        },
      });
    }

    console.log('llms.txt generated:', {
      type,
      category: category || 'N/A',
      slug: slug || 'N/A',
      tool: tool || 'N/A',
      contentLength: content.length,
    });

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': content.length.toString(),
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'max-age=3600',
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Window': '3600',
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'llms-txt', getCorsHeaders);
  }
});
