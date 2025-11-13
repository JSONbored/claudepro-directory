/**
 * Companies Handler - Public API and file uploads
 * GET: Public company profile (CDN cached)
 * POST: File upload only (upload-logo action) - all CRUD via server actions
 */

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

  // POST: File upload only
  if (req.method !== 'POST') {
    return methodNotAllowedResponse('GET, POST', postCorsHeaders);
  }

  const action = req.headers.get('X-Company-Action');

  if (!action) {
    return badRequestResponse('Missing X-Company-Action header');
  }

  // Only upload-logo is supported - all CRUD operations use server actions
  if (action !== 'upload-logo') {
    return badRequestResponse(
      `Action '${action}' not supported. Use server actions for company CRUD operations.`
    );
  }

  // Authentication required for file upload
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
    return await handleUploadLogo(req, userId);
  } catch (error) {
    console.error('Error in companies-handler:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

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
