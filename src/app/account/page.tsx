import { z } from 'zod';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { getAccountDashboard } from '@/src/lib/data/user-data';
import { Bookmark, Calendar } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';


export const metadata = generatePageMetadata('/account');

export default async function AccountDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // User-scoped edge-cached RPC via centralized data layer
  const dashboardData = await getAccountDashboard(user.id);

  // Runtime validation schema for RPC response
  const DashboardResponseSchema = z.object({
    bookmark_count: z.number(),
    profile: z.object({
      name: z.string().nullable(),
      tier: z.string().nullable(),
      created_at: z.string(),
    }),
  });

  type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

  // Validate and fallback on error
  let validatedData: DashboardResponse;
  try {
    validatedData = DashboardResponseSchema.parse(dashboardData);
  } catch (error) {
    logger.error(
      'Invalid dashboard response structure',
      error instanceof Error ? error : new Error(String(error))
    );
    validatedData = {
      bookmark_count: 0,
      profile: {
        name: null,
        tier: null,
        created_at: new Date().toISOString(),
      },
    };
  }

  const { bookmark_count, profile } = validatedData;

  const bookmarkCount = bookmark_count;
  const accountAge = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name || 'User'}!</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Bookmark className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{bookmarkCount || 0}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Saved items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedBadge
              variant="base"
              style={profile?.tier === 'pro' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {profile?.tier
                ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                : 'Free'}
            </UnifiedBadge>
            <p className={'mt-2 text-muted-foreground text-xs'}>Membership level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{accountAge}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Days active</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            • View your <NavLink href={ROUTES.ACCOUNT_ACTIVITY}>contribution history</NavLink> and
            earn badges
          </p>
          <p className="text-sm">
            • Browse the <NavLink href={ROUTES.HOME}>directory</NavLink> and bookmark your favorite
            configurations
          </p>
          <p className="text-sm">
            • View your <NavLink href={ROUTES.ACCOUNT_LIBRARY}>library</NavLink> with saved
            bookmarks and collections
          </p>
          <p className="text-sm">
            • Update your profile in <NavLink href={ROUTES.ACCOUNT_SETTINGS}>settings</NavLink>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
