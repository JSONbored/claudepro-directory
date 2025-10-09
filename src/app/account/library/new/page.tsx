import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CollectionForm } from '@/src/components/library/collection-form';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { ArrowLeft } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'Create Collection - ClaudePro Directory',
  description: 'Create a new collection of bookmarked configurations',
};

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
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <Link href="/account/library">
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Create Collection</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          Organize your bookmarks into a custom collection
        </p>
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
