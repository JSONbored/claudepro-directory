/**
 * Companies Handler - Unified companies management edge function
 * GET: Public company profile (cached)
 * POST: Authenticated CRUD operations via X-Company-Action header
 */

import type { Database } from '../_shared/database.types.ts';
import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import {
  badRequestResponse,
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
  successResponse,
  unauthorizedResponse,
} from '../_shared/utils/response.ts';
import { deleteImage, extractPathFromUrl, uploadImage } from '../_shared/utils/storage.ts';
import { supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';

type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

const postCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Company-Action',
};

Deno.serve(async (req: Request) => {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: postCorsHeaders,
    });
  }

  // GET: Public company profile (no auth required)
  if (req.method === 'GET') {
    return await handleGetProfile(req);
  }

  // POST: Authenticated actions
  if (req.method !== 'POST') {
    return methodNotAllowedResponse('GET, POST', postCorsHeaders);
  }

  const action = req.headers.get('X-Company-Action');

  if (!action) {
    return badRequestResponse('Missing X-Company-Action header');
  }

  // All POST actions require authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorizedResponse('Missing or invalid Authorization header');
  }

  const jwt = authHeader.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabaseServiceRole.auth.getUser(jwt);

  if (userError || !userData.user) {
    console.error('Auth verification failed:', userError);
    return unauthorizedResponse('Invalid authentication token');
  }

  const userId = userData.user.id;

  try {
    switch (action) {
      case 'create':
        return await handleCreate(req, userId);
      case 'update':
        return await handleUpdate(req, userId);
      case 'delete':
        return await handleDelete(req, userId);
      case 'upload-logo':
        return await handleUploadLogo(req, userId);
      case 'list':
        return await handleList(req);
      case 'search':
        return await handleSearch(req);
      case 'get-or-create':
        return await handleGetOrCreate(req, userId);
      default:
        return badRequestResponse(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in companies-handler:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

/**
 * Generate URL-safe slug from company name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Upload company logo to Storage
 * Expects multipart/form-data with 'file' field
 * Optional: 'companyId' field to delete old logo
 */
async function handleUploadLogo(req: Request, userId: string): Promise<Response> {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return badRequestResponse('Content-Type must be multipart/form-data');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const companyId = formData.get('companyId') as string | null;
    const oldLogoUrl = formData.get('oldLogoUrl') as string | null;

    if (!file) {
      return badRequestResponse('No file provided');
    }

    // Verify company ownership if updating existing company
    if (companyId) {
      const { data: company, error: fetchError } = await supabaseServiceRole
        .from('companies')
        .select('owner_id, logo')
        .eq('id', companyId)
        .single();

      if (fetchError || !company) {
        return badRequestResponse('Company not found');
      }

      if (company.owner_id !== userId) {
        return unauthorizedResponse('You do not have permission to update this company');
      }

      // Delete old logo if it exists and is from our storage
      if (oldLogoUrl || company.logo) {
        const logoToDelete = oldLogoUrl || company.logo;
        if (logoToDelete?.includes('company-logos')) {
          const oldPath = extractPathFromUrl(logoToDelete, 'company-logos');
          if (oldPath) {
            await deleteImage('company-logos', oldPath);
          }
        }
      }
    }

    // Upload new logo
    const fileBuffer = await file.arrayBuffer();
    const result = await uploadImage('company-logos', fileBuffer, file.type, userId, file.name);

    if (!result.success) {
      return badRequestResponse(result.error || 'Failed to upload logo');
    }

    return successResponse({
      publicUrl: result.publicUrl,
      path: result.path,
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return errorResponse(error instanceof Error ? error.message : 'Upload failed');
  }
}

/**
 * Create new company
 */
async function handleCreate(req: Request, userId: string): Promise<Response> {
  const data = await req.json();

  // Validate required fields
  if (!data.name || data.name.length < 2 || data.name.length > 200) {
    return badRequestResponse('Company name must be 2-200 characters');
  }

  const slug = generateSlug(data.name);

  if (!slug || slug.length === 0) {
    return badRequestResponse('Company name must contain at least one alphanumeric character');
  }

  // Check if slug already exists (deduplication)
  const { data: existingCompany } = await supabaseServiceRole
    .from('companies')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (existingCompany) {
    return badRequestResponse(
      `Company "${existingCompany.name}" already exists with this name. Please use a different name or select the existing company.`
    );
  }

  // Validate optional fields
  if (data.website && !data.website.match(/^https?:\/\/[^\s]+$/)) {
    return badRequestResponse('Invalid website URL format');
  }

  if (data.logo && !data.logo.match(/^https?:\/\/[^\s]+$/)) {
    return badRequestResponse('Invalid logo URL format');
  }

  if (data.description && data.description.length > 1000) {
    return badRequestResponse('Description must be 1000 characters or less');
  }

  // Prepare insert data
  const insertData: CompanyInsert = {
    name: data.name.trim(),
    slug,
    owner_id: userId,
    website: data.website?.trim() || null,
    logo: data.logo?.trim() || null,
    description: data.description?.trim() || null,
    size: data.size || null,
    industry: data.industry?.trim() || null,
    featured: false, // Only admins can set featured
  };

  // Insert company
  const { data: company, error } = await supabaseServiceRole
    .from('companies')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    return errorResponse(`Failed to create company: ${error.message}`);
  }

  return successResponse({ company });
}

/**
 * Update existing company (ownership verified)
 */
async function handleUpdate(req: Request, userId: string): Promise<Response> {
  const data = await req.json();

  if (!data.id) {
    return badRequestResponse('Company ID is required');
  }

  // Verify ownership
  const { data: existingCompany, error: fetchError } = await supabaseServiceRole
    .from('companies')
    .select('owner_id')
    .eq('id', data.id)
    .single();

  if (fetchError || !existingCompany) {
    return badRequestResponse('Company not found');
  }

  if (existingCompany.owner_id !== userId) {
    return unauthorizedResponse('You do not have permission to update this company');
  }

  // Validate optional fields if provided
  if (data.name !== undefined) {
    if (!data.name || data.name.length < 2 || data.name.length > 200) {
      return badRequestResponse('Company name must be 2-200 characters');
    }
  }

  if (data.website !== undefined && data.website && !data.website.match(/^https?:\/\/[^\s]+$/)) {
    return badRequestResponse('Invalid website URL format');
  }

  if (data.logo !== undefined && data.logo && !data.logo.match(/^https?:\/\/[^\s]+$/)) {
    return badRequestResponse('Invalid logo URL format');
  }

  if (data.description !== undefined && data.description && data.description.length > 1000) {
    return badRequestResponse('Description must be 1000 characters or less');
  }

  // Prepare update data (exclude protected fields)
  const updateData: CompanyUpdate = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
    updateData.slug = generateSlug(data.name);
  }
  if (data.website !== undefined) updateData.website = data.website?.trim() || null;
  if (data.logo !== undefined) updateData.logo = data.logo?.trim() || null;
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.size !== undefined) updateData.size = data.size || null;
  if (data.industry !== undefined) updateData.industry = data.industry?.trim() || null;

  // Update company
  const { data: company, error } = await supabaseServiceRole
    .from('companies')
    .update(updateData)
    .eq('id', data.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    return errorResponse(`Failed to update company: ${error.message}`);
  }

  return successResponse({ company });
}

/**
 * Soft-delete company (ownership verified)
 */
async function handleDelete(req: Request, userId: string): Promise<Response> {
  const data = await req.json();

  if (!data.id) {
    return badRequestResponse('Company ID is required');
  }

  // Verify ownership
  const { data: existingCompany, error: fetchError } = await supabaseServiceRole
    .from('companies')
    .select('owner_id')
    .eq('id', data.id)
    .single();

  if (fetchError || !existingCompany) {
    return badRequestResponse('Company not found');
  }

  if (existingCompany.owner_id !== userId) {
    return unauthorizedResponse('You do not have permission to delete this company');
  }

  // Check if company has active jobs
  const { count: activeJobCount } = await supabaseServiceRole
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', data.id)
    .eq('status', 'active');

  if (activeJobCount && activeJobCount > 0) {
    return badRequestResponse(
      `Cannot delete company with ${activeJobCount} active job(s). Please archive or delete the jobs first.`
    );
  }

  // Soft delete by setting owner_id to null (preserves job references)
  const { error } = await supabaseServiceRole
    .from('companies')
    .update({ owner_id: null })
    .eq('id', data.id);

  if (error) {
    console.error('Error deleting company:', error);
    return errorResponse(`Failed to delete company: ${error.message}`);
  }

  return successResponse({ message: 'Company deleted successfully' });
}

/**
 * List companies (public, paginated)
 */
async function handleList(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const page = Number.parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = (page - 1) * limit;

  const {
    data: companies,
    error,
    count,
  } = await supabaseServiceRole
    .from('companies')
    .select('*', { count: 'exact' })
    .not('owner_id', 'is', null) // Exclude soft-deleted companies
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error listing companies:', error);
    return errorResponse(`Failed to list companies: ${error.message}`);
  }

  return successResponse({
    companies: companies || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

/**
 * Search companies by name (autocomplete)
 */
async function handleSearch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return badRequestResponse('Search query is required');
  }

  const searchTerm = query.trim();

  // Use trigram similarity search for fuzzy matching
  const { data: companies, error } = await supabaseServiceRole
    .from('companies')
    .select('id, name, slug, logo, website')
    .not('owner_id', 'is', null) // Exclude soft-deleted companies
    .ilike('name', `%${searchTerm}%`)
    .order('name')
    .limit(10);

  if (error) {
    console.error('Error searching companies:', error);
    return errorResponse(`Failed to search companies: ${error.message}`);
  }

  return successResponse({ companies: companies || [] });
}

/**
 * Get existing company by name or create new one (auto-creation for jobs)
 * Used by jobs-handler to auto-link companies
 */
async function handleGetOrCreate(req: Request, userId: string): Promise<Response> {
  const data = await req.json();

  if (!data.name || data.name.length < 2 || data.name.length > 200) {
    return badRequestResponse('Company name must be 2-200 characters');
  }

  const slug = generateSlug(data.name);

  if (!slug || slug.length === 0) {
    return badRequestResponse('Company name must contain at least one alphanumeric character');
  }

  // Check if company already exists by slug
  const { data: existingCompany } = await supabaseServiceRole
    .from('companies')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (existingCompany) {
    return successResponse({
      company: existingCompany,
      created: false,
    });
  }

  // Create new company
  const insertData: CompanyInsert = {
    name: data.name.trim(),
    slug,
    owner_id: userId,
    website: data.website?.trim() || null,
    logo: data.logo?.trim() || null,
    featured: false,
  };

  const { data: newCompany, error } = await supabaseServiceRole
    .from('companies')
    .insert(insertData)
    .select('id, name, slug')
    .single();

  if (error) {
    console.error('Error creating company:', error);
    return errorResponse(`Failed to create company: ${error.message}`);
  }

  return successResponse({
    company: newCompany,
    created: true,
  });
}

/**
 * Get company profile with active jobs and stats (public, cached)
 * Uses get_company_profile() RPC for optimized single-query fetch
 */
async function handleGetProfile(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug || slug.trim().length === 0) {
    return jsonResponse({ error: 'Company slug is required' }, 400, getOnlyCorsHeaders);
  }

  // Call optimized RPC function (leverages company_job_stats materialized view)
  const { data: profile, error } = await supabaseServiceRole.rpc('get_company_profile', {
    p_slug: slug.trim(),
  });

  if (error) {
    console.error('Error fetching company profile:', error);
    return errorResponse(error, 'companies-handler:get-profile', getOnlyCorsHeaders);
  }

  if (!profile) {
    return jsonResponse({ error: 'Company not found' }, 404, getOnlyCorsHeaders);
  }

  // Return with aggressive CDN caching (30min cache, 1hr stale-while-revalidate)
  // Uses Supabase CDN for cached egress billing (3x cheaper)
  return jsonResponse(profile, 200, {
    ...getOnlyCorsHeaders,
    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'max-age=1800',
  });
}
