'use client';

/**
 * User Menu Component
 * Authentication-aware dropdown menu for user account access
 *
 * Features:
 * - Shows "Sign In" button when not authenticated
 * - Shows user avatar dropdown when authenticated
 * - Includes all account pages (For You, Dashboard, Library, etc.)
 * - Conditional Sponsorships link (only if user has campaigns)
 * - Sign Out functionality
 * - Responsive design with proper touch targets
 * - Optimistic UI updates
 * - Type-safe with Supabase session
 *
 * Security:
 * - Client-side auth state from Supabase
 * - Automatic redirect handling
 * - Secure sign-out with cache invalidation
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Activity,
  Bookmark,
  Briefcase,
  Home,
  LogOut,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface UserProfile {
  name: string | null;
  slug: string | null;
  image: string | null;
  hasSponsorships?: boolean;
}

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Load user session and profile
  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setUser(currentUser);

        if (currentUser) {
          // Fetch user profile and check for sponsorships
          const [profileResult, sponsorshipsResult] = await Promise.all([
            supabase.from('users').select('name, slug, image').eq('id', currentUser.id).single(),
            supabase.from('sponsored_content').select('id').eq('user_id', currentUser.id).limit(1),
          ]);

          if (profileResult.data) {
            setProfile({
              ...profileResult.data,
              hasSponsorships: !!(sponsorshipsResult.data && sponsorshipsResult.data.length > 0),
            });
          }
        }
      } catch {
        // Silent fail - auth state will show loading or unauthenticated
      } finally {
        setLoading(false);
      }
    };

    loadUser().catch(() => {
      // Silent fail - component will show loading or unauthenticated state
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(`Sign out failed: ${error.message}`);
      setSigningOut(false);
    } else {
      toast.success('Signed out successfully');
      setUser(null);
      setProfile(null);
      router.push('/');
      router.refresh();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <output
        className="h-9 w-9 rounded-full bg-muted animate-pulse"
        aria-busy="true"
        aria-live="polite"
      />
    );
  }

  // Not authenticated - show Sign In button
  if (!user) {
    return (
      <Button
        asChild
        variant="default"
        size="sm"
        className="min-h-[44px] min-w-[44px]"
        aria-label="Sign in to your account"
      >
        <Link href="/login">Sign In</Link>
      </Button>
    );
  }

  // Authenticated - show user dropdown menu
  const userName = profile?.name || user.email || 'User';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full min-h-[44px] min-w-[44px] p-0"
          aria-label="Open user menu"
        >
          <Avatar className="h-9 w-9">
            {profile?.image && (
              <AvatarImage src={profile.image} alt={userName} className="object-cover" />
            )}
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* User info header */}
        <DropdownMenuLabel>
          <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-3`}>
            <Avatar className="h-10 w-10">
              {profile?.image && (
                <AvatarImage src={profile.image} alt={userName} className="object-cover" />
              )}
              <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 overflow-hidden">
              <p className="text-sm font-medium leading-none truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Account navigation links */}
        <DropdownMenuItem asChild>
          <Link href="/for-you" className="cursor-pointer">
            <Sparkles className="mr-2 h-4 w-4" />
            <span>For You</span>
            <span className="ml-auto text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
              NEW
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account/library" className="cursor-pointer">
            <Bookmark className="mr-2 h-4 w-4" />
            <span>Library</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account/activity" className="cursor-pointer">
            <Activity className="mr-2 h-4 w-4" />
            <span>Activity</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account/submissions" className="cursor-pointer">
            <Send className="mr-2 h-4 w-4" />
            <span>Submissions</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account/jobs" className="cursor-pointer">
            <Briefcase className="mr-2 h-4 w-4" />
            <span>Jobs</span>
          </Link>
        </DropdownMenuItem>

        {/* Conditional Sponsorships link */}
        {profile?.hasSponsorships && (
          <DropdownMenuItem asChild>
            <Link href="/account/sponsorships" className="cursor-pointer">
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Sponsorships</span>
            </Link>
          </DropdownMenuItem>
        )}

        {/* View public profile */}
        {profile?.slug && (
          <DropdownMenuItem asChild>
            <Link href={`/u/${profile.slug}`} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>View Profile</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem asChild>
          <Link href="/account/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={signingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
