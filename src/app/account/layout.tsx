/**
 * Account Layout - Protected dashboard layout with sidebar navigation.
 */

import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UnifiedButton } from '@/src/components/domain/unified-button';
import { Button } from '@/src/components/primitives/button';
import { Card } from '@/src/components/primitives/card';
import {
  Activity,
  Bookmark,
  Briefcase,
  Home,
  Send,
  Settings,
  TrendingUp,
  User,
} from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login');

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.expires_at) {
    const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);
    if (expiresIn < 3600) {
      await supabase.auth.refreshSession();
    }
  }

  let profile: Pick<Tables<'users'>, 'name' | 'slug' | 'image'> | null = null;

  const { data: existingProfile } = await supabase
    .from('users')
    .select('name, slug, image')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    profile = existingProfile;
  } else {
    const userInsert: Database['public']['Tables']['users']['Insert'] = {
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    };

    await supabase.from('users').upsert(userInsert);

    const { data: newProfile } = await supabase
      .from('users')
      .select('name, slug, image')
      .eq('id', user.id)
      .single();
    profile = newProfile;
  }

  const { data: sponsorships } = await supabase
    .from('sponsored_content')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  const hasSponsorships = sponsorships && sponsorships.length > 0;

  const navigation = [
    { name: 'Dashboard', href: '/account', icon: Home },
    { name: 'Activity', href: '/account/activity', icon: Activity },
    { name: 'Library', href: '/account/library', icon: Bookmark },
    { name: 'Jobs', href: '/account/jobs', icon: Briefcase },
    { name: 'Submissions', href: '/account/submissions', icon: Send },
    ...(hasSponsorships
      ? [{ name: 'Sponsorships', href: '/account/sponsorships', icon: TrendingUp }]
      : []),
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ];

  return (
    <div className={'min-h-screen bg-background'}>
      <div className={'border-b px-4 py-4'}>
        <div className={'container mx-auto flex items-center justify-between'}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Link href="/" className="group-hover:text-accent transition-colors-smooth">
              ← Back to Directory
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {profile?.slug && (
              <Link href={`/u/${profile.slug}`} className="text-sm">
                View Profile
              </Link>
            )}
            <UnifiedButton variant="auth-signout" />
          </div>
        </div>
      </div>

      <div className={'container mx-auto px-4 py-8'}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 h-fit p-4">
            <div className={'flex items-center gap-3 mb-6 pb-4 border-b'}>
              {profile?.image ? (
                <Image
                  src={profile.image}
                  alt={`${profile.name || 'User'}'s avatar`}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="font-medium">{profile?.name || user.email}</p>
                <p className={UI_CLASSES.TEXT_XS_MUTED}>{user.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button variant="ghost" className={'w-full justify-start text-sm'}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </Card>
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
