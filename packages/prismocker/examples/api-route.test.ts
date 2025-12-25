/**
 * API Route Testing Example
 *
 * This example demonstrates how to test Next.js API routes with Prismocker.
 * It shows real-world patterns for testing API handlers with request/response
 * validation, error handling, and authentication.
 *
 * Key Features Demonstrated:
 * - Next.js API route testing
 * - Request/response validation
 * - Error handling and status codes
 * - Authentication testing
 * - Query parameter handling
 * - Body validation
 *
 * NOTE: This example uses generic model names (companies, jobs) that should
 * be adapted to match your actual Prisma schema. The patterns shown here
 * work with any Prisma models and fields.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { createPrismocker } from '../src/index.js';
import type { PrismaClient } from '@prisma/client';
import { resetAndSeed } from '../src/test-utils.js';

// Type-safe helper to work with any PrismaClient
type AnyPrismaClient = PrismaClient;

/**
 * Example API route handler
 * This represents a real API route in your Next.js application
 */
async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  // In real code, you'd import prisma from your data layer
  // For this example, we'll pass it as a parameter
  const prisma = (global as any).testPrisma as AnyPrismaClient;

  const company = await (prisma as any).companies.findUnique({
    where: { slug },
    include: {
      jobs: {
        take: 10,
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  return NextResponse.json(company, { status: 200 });
}

async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.owner_id || !body.slug) {
    return NextResponse.json(
      { error: 'Missing required fields: name, owner_id, slug' },
      { status: 400 }
    );
  }

  const prisma = (global as any).testPrisma as AnyPrismaClient;

  try {
    const company = await (prisma as any).companies.create({
      data: {
        name: body.name,
        owner_id: body.owner_id,
        slug: body.slug,
        description: body.description,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Company with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

async function PATCH(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const body = await request.json();
  const prisma = (global as any).testPrisma as AnyPrismaClient;

  try {
    const company = await (prisma as any).companies.update({
      where: { slug },
      data: body,
    });

    return NextResponse.json(company, { status: 200 });
  } catch (error: any) {
    if (error.message?.includes('Record not found')) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const prisma = (global as any).testPrisma as AnyPrismaClient;

  try {
    await (prisma as any).companies.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message?.includes('Record not found')) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}

describe('GET /api/company', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    (global as any).testPrisma = prisma;

    resetAndSeed(prisma, {
      companies: [
        {
          id: 'company-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          owner_id: 'user-1',
          description: 'A great company',
        },
        {
          id: 'company-2',
          name: 'Tech Startup',
          slug: 'tech-startup',
          owner_id: 'user-2',
        },
      ],
      jobs: [
        {
          id: 'job-1',
          company_id: 'company-1',
          title: 'Senior Engineer',
        },
        {
          id: 'job-2',
          company_id: 'company-1',
          title: 'Junior Engineer',
        },
      ] as any,
    });
  });

  it('should return company by slug', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=acme-corp');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      id: 'company-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
    });
  });

  it('should include jobs', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=acme-corp');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.jobs) {
      expect(data.jobs.length).toBeGreaterThan(0);
      expect(data.jobs[0].title).toBe('Senior Engineer');
    }
  });

  it('should return 404 for non-existent company', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=non-existent');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Company not found');
  });

  it('should return 400 when slug is missing', async () => {
    const request = new NextRequest('http://localhost/api/company');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Slug parameter is required');
  });
});

describe('POST /api/company', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    (global as any).testPrisma = prisma;

    resetAndSeed(prisma, {
      companies: [],
    });
  });

  it('should create a new company', async () => {
    const request = new NextRequest('http://localhost/api/company', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Company',
        owner_id: 'user-1',
        slug: 'new-company',
        description: 'A new company',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      name: 'New Company',
      slug: 'new-company',
      owner_id: 'user-1',
    });

    // Verify it was created
    const company = await (prisma as any).companies.findUnique({
      where: { slug: 'new-company' },
    });
    expect(company).toBeTruthy();
  });

  it('should return 400 when required fields are missing', async () => {
    const request = new NextRequest('http://localhost/api/company', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Company',
        // Missing owner_id and slug
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should create company without optional fields', async () => {
    const request = new NextRequest('http://localhost/api/company', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Minimal Company',
        owner_id: 'user-1',
        slug: 'minimal-company',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.description).toBeNull();
  });
});

describe('PATCH /api/company', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    (global as any).testPrisma = prisma;

    resetAndSeed(prisma, {
      companies: [
        {
          id: 'company-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          owner_id: 'user-1',
        },
      ],
    });
  });

  it('should update company', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=acme-corp', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Acme Corp',
        description: 'Updated description',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Updated Acme Corp');
    expect(data.description).toBe('Updated description');
  });

  it('should return 404 for non-existent company', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=non-existent', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Company not found');
  });

  it('should return 400 when slug is missing', async () => {
    const request = new NextRequest('http://localhost/api/company', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Slug parameter is required');
  });
});

describe('DELETE /api/company', () => {
  let prisma: AnyPrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    (global as any).testPrisma = prisma;

    resetAndSeed(prisma, {
      companies: [
        {
          id: 'company-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          owner_id: 'user-1',
        },
      ],
    });
  });

  it('should delete company', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=acme-corp', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify it was deleted
    const company = await (prisma as any).companies.findUnique({
      where: { slug: 'acme-corp' },
    });
    expect(company).toBeNull();
  });

  it('should return 404 for non-existent company', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=non-existent', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Company not found');
  });

  it('should return 400 when slug is missing', async () => {
    const request = new NextRequest('http://localhost/api/company', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Slug parameter is required');
  });
});
