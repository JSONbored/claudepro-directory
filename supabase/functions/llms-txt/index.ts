/**
 * LLMs.txt Edge Function
 * Single PostgreSQL RPC call for AI-optimized plain text generation
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

const getCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
    const category = url.searchParams.get('category');
    const slug = url.searchParams.get('slug');

    if (!category || !slug) {
      return badRequestResponse(
        'Missing required parameters: category and slug',
        getCorsHeaders
      );
    }

    const validCategories = [
      'agents',
      'commands',
      'hooks',
      'mcp',
      'rules',
      'skills',
      'statuslines',
      'collections',
    ];
    if (!validCategories.includes(category)) {
      return badRequestResponse(`Invalid category: ${category}`, getCorsHeaders);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.rpc('generate_llms_txt_content', {
      p_category: category,
      p_slug: slug,
    });

    if (error) {
      console.error('RPC error:', error);
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

    const content = data as {
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
      metadata?: Record<string, unknown>;
    };

    const sections: string[] = [];

    sections.push(`# ${content.title}\n`);
    sections.push(`${content.description}\n`);
    sections.push('---\n');

    sections.push('## Metadata\n');
    sections.push(`**Title:** ${content.title}`);
    sections.push(`**Category:** ${content.category}`);
    if (content.author) sections.push(`**Author:** ${content.author}`);
    if (content.date_added) {
      const date = new Date(content.date_added);
      sections.push(
        `**Added:** ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      );
    }
    if (content.tags && content.tags.length > 0) {
      sections.push(`**Tags:** ${content.tags.join(', ')}`);
    }
    sections.push(`**URL:** ${SITE_URL}/${content.category}/${content.slug}\n`);

    sections.push('## Overview\n');
    sections.push(`${content.description}\n`);

    sections.push('## Content\n');
    if (content.detailed_content) {
      sections.push(content.detailed_content);
    } else if (content.content) {
      sections.push(content.content);
    }
    sections.push('');

    sections.push('---\n');
    sections.push(`Source: Claude Pro Directory`);
    sections.push(`Website: ${SITE_URL}`);
    sections.push(`URL: ${SITE_URL}/${content.category}/${content.slug}\n`);
    sections.push('This content is optimized for Large Language Models (LLMs).');
    sections.push('For full formatting and interactive features, visit the website.');

    const llmsTxt = sections.join('\n');

    console.log('llms.txt generated:', {
      category,
      slug,
      contentLength: llmsTxt.length,
    });

    return new Response(llmsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'llms-txt', getCorsHeaders);
  }
});
