import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CollectionForm } from '@/src/components/core/forms/collection-form';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants';
import { ArrowLeft } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/library/new');

export default async function NewCollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's bookmarks to display as options
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link href={ROUTES.ACCOUNT_LIBRARY}>
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
        <h1 className="mb-2 font-bold text-3xl">Create Collection</h1>
        <p className="text-muted-foreground">Organize your bookmarks into a custom collection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionForm
            bookmarks={(bookmarks || []).map((b) => ({ ...b, notes: b.notes ?? '' }))}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
