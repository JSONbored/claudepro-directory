import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

// Cache the content for 1 hour
export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  try {
    // Validate content type
    const validTypes = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Read content directory
    const contentDir = path.join(process.cwd(), 'content', type);
    const files = await fs.readdir(contentDir);

    // Load all JSON files
    const content = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(contentDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          return JSON.parse(data);
        })
    );

    return NextResponse.json(content, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error(`Error loading ${type} content:`, error);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
