# Storage Utilities

Shared helpers for Supabase Storage interactions inside edge functions. The goal is to keep uploads, deletes, proxies, and signed URL creation consistent, typed, and resource-efficient.

## File Layout

- `client.ts` – thin wrappers around the shared Supabase clients plus helpers for building object paths, sanitizing filenames, deleting objects, and creating signed URLs.
- `upload.ts` – reusable validation policies (`FileValidationPolicy`), buffer validators, and upload helpers (`uploadObject`, `uploadImage`).
- `proxy.ts` – CDN-friendly proxy (`proxyStorageFile`), shared header builder, and MIME type detection.

## Usage

### Get a client or build a path

```ts
import { buildStorageObjectPath, getStorageServiceClient } from '../utils/storage/client.ts';

const path = buildStorageObjectPath({
  prefix: 'jobs',
  userId: user.id,
  fileName: 'logo',
  extension: 'png',
});

await getStorageServiceClient().storage.from('company-assets').download(path);
```

### Upload with validation

```ts
import { uploadObject, IMAGE_UPLOAD_POLICY } from '../utils/storage/upload.ts';

const result = await uploadObject({
  bucket: 'company-assets',
  buffer,
  mimeType: 'image/png',
  validationPolicy: IMAGE_UPLOAD_POLICY,
  pathOptions: { prefix: `companies/${companyId}`, fileName: 'logo' },
});

if (!result.success) {
  return errorResponse(new Error(result.error ?? 'upload failed'), 'edge:logo-upload');
}
```

### Proxy a stored file

```ts
import { proxyStorageFile } from '../utils/storage/proxy.ts';

return proxyStorageFile({
  bucket: 'public-assets',
  path: `${category}/${slug}.zip`,
  cacheControl: 'public, max-age=604800',
  disposition: 'attachment',
});
```

## Manual QA Checklist

1. **Upload happy path**
   - Upload a PNG under 200 KB via `uploadObject` → expect `success: true` and a valid public URL.
2. **Upload validation**
   - Upload a file exceeding the policy size → expect `success: false` with descriptive error.
   - Upload a disallowed MIME type → expect rejection before hitting Supabase.
3. **Delete helpers**
   - Call `deleteStorageObject` and confirm the file is removed from the bucket.
4. **Signed URL**
   - Generate a signed URL with `createSignedStorageUrl` and verify it expires after the TTL.
5. **Proxy route**
   - Proxy an existing object and inspect headers (`Cache-Control`, `Content-Disposition`, `X-Storage-*`).
   - Proxy a missing object and confirm structured JSON error with HTTP 404.

Document outcomes (success/fail, timestamps, buckets) in the edge functions QA log after each run.
