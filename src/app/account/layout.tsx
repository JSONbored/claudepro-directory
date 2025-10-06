import Link from 'next/link';
import { createClient } from '@/src/lib/supabase/server';
import { SignOutButton } from '@/src/components/auth/auth-buttons';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Bookmark, Briefcase, Home, Settings, User } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { redirect } from 'next/navigation';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Double-check auth (middleware should already handle this)
  if (!user) {
    redirect('/login');
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('name, slug, image')
    .eq('id', user.id)
    .single();

  const navigation = [
    { name: 'Dashboard', href: '/account', icon: Home },
    { name: 'Bookmarks', href: '/account/bookmarks', icon: Bookmark },
    { name: 'Jobs', href: '/account/jobs', icon: Briefcase },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ];

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Top navigation */}
      <div className={`border-b ${UI_CLASSES.PX_4} py-4`}>
        <div className={`container ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_BETWEEN}`}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Link href="/" className={UI_CLASSES.HOVER_TEXT_ACCENT}>
              ← Back to Directory
            </Link>
          </div>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_4}>
            {profile?.slug && (
              <Link href={`/u/${profile.slug}`} className={UI_CLASSES.TEXT_SM}>
                View Profile
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </div>

      <div className={`container ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.PX_4} py-8`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="md:col-span-1 h-fit p-4">
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} ${UI_CLASSES.MB_6} pb-4 border-b`}>
              {profile?.image ? (
                <img
                  src={profile.image}
                  alt={profile.name || 'User'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className={UI_CLASSES.FONT_MEDIUM}>{profile?.name || user.email}</p>
                <p className={UI_CLASSES.TEXT_XS_MUTED}>{user.email}</p>
              </div>
            </div>

            <nav className={UI_CLASSES.SPACE_Y_2}>
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${UI_CLASSES.TEXT_SM}`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </Card>

          {/* Main content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
