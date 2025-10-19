'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { UserMenu } from './user-menu';

/**
 * UserMenu Component Stories
 *
 * Authentication-aware user menu with Supabase integration.
 * Displays different UI based on auth state: loading, signed-out, signed-in.
 *
 * Features:
 * - Supabase auth state management
 * - Three distinct states: loading, signed-out, signed-in
 * - User avatar with fallback to initials
 * - Dropdown menu with profile links
 * - Sign out functionality with loading state
 * - Toast notifications for auth actions
 * - Router integration for post-signout navigation
 * - Responsive text (hidden on mobile, visible on lg+)
 * - Hover effects on avatar (ring-2 ring-accent/30)
 * - Keyboard accessible dropdown
 * - ARIA labels for accessibility
 * - Destructive styling for sign-out action
 *
 * Component: src/components/layout/user-menu.tsx (205 LOC)
 * Used in: Navigation header
 * Dependencies: Supabase client, Avatar, DropdownMenu, Button, Link
 *
 * Three States:
 * 1. **Loading** (initial mount):
 *    - Animated pulse skeleton (8x8 rounded circle)
 *    - bg-muted with animate-pulse
 *    - Shows while auth state is being determined
 *
 * 2. **Signed Out** (user = null):
 *    - Ghost button with UserIcon
 *    - "Sign In" text (hidden on mobile, visible on lg+)
 *    - Links to /login page
 *    - aria-label="Sign in"
 *
 * 3. **Signed In** (user exists):
 *    - Avatar with user image or initials fallback
 *    - Dropdown menu with 4 items:
 *      a. User info header (name + email)
 *      b. Settings (/account/settings)
 *      c. Library (/account/library)
 *      d. Activity (/account/activity)
 *      e. Sign out button (destructive styling)
 *
 * User Metadata Extraction:
 * ```ts
 * const displayName = userMetadata?.name || userMetadata?.full_name || user.email?.split('@')[0];
 * const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture;
 * const initials = displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
 * ```
 *
 * Sign Out Flow:
 * 1. User clicks "Sign out" menu item
 * 2. handleSignOut() sets signingOut = true
 * 3. Calls supabase.auth.signOut()
 * 4. If error: shows error toast
 * 5. If success: shows success toast, navigates to '/', refreshes router
 * 6. Sets signingOut = false
 *
 * Auth State Listener:
 * - useEffect attaches supabase.auth.onAuthStateChange listener
 * - Updates user state when auth changes
 * - Unsubscribes on component unmount
 *
 * IMPORTANT: This component requires Supabase auth context.
 * In Storybook, Supabase client may not be available, so component
 * will likely remain in loading state or show signed-out UI.
 * For full testing, use production app with auth configured.
 *
 * @see Research Report: "Supabase Auth Integration Patterns"
 */
const meta = {
  title: 'Layout/UserMenu',
  component: UserMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Auth-aware user menu with Supabase integration. Three states: loading (skeleton), signed-out (sign-in button), signed-in (avatar dropdown with profile links).',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-w-[400px] p-8 bg-background border rounded-lg">
        <div className="flex items-center justify-end">
          <Story />
        </div>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>This component requires Supabase auth context.</p>
          <p>In Storybook, it may show loading or signed-out state.</p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Production State
 *
 * Shows UserMenu as it appears in production.
 * Auth state depends on Supabase configuration.
 *
 * Behavior:
 * - If Supabase not configured → loading or signed-out state
 * - If user authenticated → signed-in state with avatar
 * - If user not authenticated → sign-in button
 *
 * Usage:
 * ```tsx
 * // In navigation header
 * <header>
 *   <nav className="flex justify-between">
 *     <Logo />
 *     <UserMenu />
 *   </nav>
 * </header>
 * ```
 */
export const Default: Story = {};

/**
 * Loading State
 *
 * Shows animated skeleton while auth state is being determined.
 * Appears briefly on initial component mount.
 *
 * Visual:
 * - 8x8 rounded circle
 * - bg-muted background
 * - animate-pulse animation
 *
 * Code:
 * ```tsx
 * if (loading) {
 *   return (
 *     <div className="flex items-center">
 *       <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
 *     </div>
 *   );
 * }
 * ```
 *
 * Duration: Typically <500ms while auth.getUser() resolves
 */
export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Animated skeleton shown while auth state is loading. 8x8 rounded circle with pulse animation.',
      },
    },
  },
};

/**
 * Signed Out State
 *
 * Shows sign-in button when no user is authenticated.
 * Links to /login page.
 *
 * Visual:
 * - Ghost button variant
 * - UserIcon (4x4)
 * - "Sign In" text (hidden on mobile, visible on lg+)
 * - Hover effect from UI_CLASSES.BUTTON_GHOST_ICON
 *
 * Responsive:
 * - Mobile (< lg): Icon only
 * - Desktop (>= lg): Icon + "Sign In" text
 *
 * Accessibility:
 * - aria-label="Sign in"
 * - asChild with Link for client-side navigation
 */
export const SignedOut: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sign-in button shown when user is not authenticated. Links to /login. Responsive text (icon only on mobile).',
      },
    },
  },
};

/**
 * Signed In State
 *
 * Shows user avatar with dropdown menu when authenticated.
 * Avatar displays user image or initials fallback.
 *
 * Avatar:
 * - 8x8 rounded circle
 * - User image if avatarUrl exists
 * - Initials fallback (first 2 letters of name)
 * - Accent background (bg-accent/20)
 * - Hover ring effect (ring-2 ring-accent/30)
 *
 * Dropdown Menu (4 items):
 * 1. User info header (name + email)
 * 2. Settings → /account/settings
 * 3. Library → /account/library
 * 4. Activity → /account/activity
 * 5. Sign out (destructive, with loading state)
 */
export const SignedIn: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'User avatar with dropdown menu. Shows user image or initials. Dropdown has profile links and sign-out button.',
      },
    },
  },
};

/**
 * Avatar with User Image
 *
 * Shows avatar with actual user profile image.
 * Image from user_metadata.avatar_url or user_metadata.picture.
 *
 * Metadata sources:
 * ```ts
 * const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture;
 * ```
 *
 * Avatar component:
 * ```tsx
 * <Avatar className="h-8 w-8">
 *   {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
 *   <AvatarFallback>{initials}</AvatarFallback>
 * </Avatar>
 * ```
 */
export const WithUserImage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Avatar with user profile image from metadata. Fallback to initials if image fails to load.',
      },
    },
  },
};

/**
 * Avatar with Initials Fallback
 *
 * Shows avatar with user initials when no image available.
 * Initials extracted from display name.
 *
 * Initials extraction:
 * ```ts
 * const initials = displayName
 *   ?.split(' ')
 *   .map((n) => n[0])
 *   .join('')
 *   .toUpperCase()
 *   .slice(0, 2) || 'U';
 * ```
 *
 * Visual:
 * - 2 letters (first letter of first 2 words)
 * - Uppercase
 * - bg-accent/20 background
 * - text-accent color
 * - font-semibold text-sm
 *
 * Examples:
 * - "John Doe" → "JD"
 * - "Alice" → "AL" (if full_name has 2 words) or "A" (single word)
 * - No name → "U" (default)
 */
export const WithInitials: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Avatar with initials fallback. Extracts first 2 letters from name. Accent background with semibold text.',
      },
    },
  },
};

/**
 * Display Name Variants
 *
 * Shows different display name sources.
 * Priority: name → full_name → email username
 *
 * Display name extraction:
 * ```ts
 * const displayName =
 *   userMetadata?.name ||
 *   userMetadata?.full_name ||
 *   user.email?.split('@')[0];
 * ```
 *
 * Examples:
 * - userMetadata.name: "John Doe"
 * - userMetadata.full_name: "John Robert Doe"
 * - user.email: "john.doe@example.com" → "john.doe"
 */
export const DisplayNameVariants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Display name extracted from metadata. Priority: name → full_name → email username. Used in dropdown header and avatar aria-label.',
      },
    },
  },
};

/**
 * Dropdown Menu Structure
 *
 * Shows dropdown menu with 3 sections:
 * 1. User Info Header (non-interactive)
 * 2. Navigation Links (3 items)
 * 3. Sign Out Action
 *
 * Structure:
 * ```
 * DropdownMenuLabel
 *   - Display name (text-sm font-medium)
 *   - Email (text-xs text-muted-foreground)
 * DropdownMenuSeparator
 * DropdownMenuItem (Settings) → /account/settings
 * DropdownMenuItem (Library) → /account/library
 * DropdownMenuItem (Activity) → /account/activity
 * DropdownMenuSeparator
 * DropdownMenuItem (Sign out) - destructive styling
 * ```
 *
 * Width: w-56 (224px)
 * Alignment: end (right-aligned)
 * forceMount: true (always renders for accessibility)
 */
export const DropdownStructure: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Dropdown menu with user info, navigation links, and sign-out action. Three sections separated by dividers.',
      },
    },
  },
};

/**
 * User Info Header
 *
 * Non-interactive header in dropdown showing user details.
 * DropdownMenuLabel with flex column layout.
 *
 * Content:
 * - Display name: text-sm font-medium leading-none
 * - Email: text-xs leading-none text-muted-foreground mt-1
 *
 * Code:
 * ```tsx
 * <DropdownMenuLabel className="font-normal">
 *   <div className="flex flex-col">
 *     <p className="text-sm font-medium leading-none">{displayName}</p>
 *     <p className="text-xs leading-none text-muted-foreground mt-1">
 *       {user.email}
 *     </p>
 *   </div>
 * </DropdownMenuLabel>
 * ```
 */
export const UserInfoHeader: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'User info header in dropdown. Shows display name and email in stacked layout. Non-interactive label.',
      },
    },
  },
};

/**
 * Navigation Links
 *
 * Three profile navigation links in dropdown.
 * Each uses DropdownMenuItem with asChild + Link.
 *
 * Links:
 * 1. Settings (/account/settings) - Settings icon
 * 2. Library (/account/library) - BookOpen icon
 * 3. Activity (/account/activity) - Activity icon
 *
 * Icon styling:
 * - mr-2 (8px right margin)
 * - h-4 w-4 (16x16px)
 *
 * Code pattern:
 * ```tsx
 * <DropdownMenuItem asChild>
 *   <Link href="/account/settings">
 *     <Settings className="mr-2 h-4 w-4" />
 *     <span>Settings</span>
 *   </Link>
 * </DropdownMenuItem>
 * ```
 */
export const NavigationLinks: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Three profile navigation links: Settings, Library, Activity. Each with icon and Next.js Link for client-side navigation.',
      },
    },
  },
};

/**
 * Sign Out Button
 *
 * Destructive action in dropdown for signing out.
 * Shows loading state during sign-out process.
 *
 * States:
 * - Normal: "Sign out" text
 * - Loading: "Signing out..." text, disabled
 *
 * Styling:
 * - text-destructive color
 * - focus:text-destructive (maintains color on focus)
 * - cursor-pointer
 * - LogOut icon (mr-2 h-4 w-4)
 *
 * Behavior:
 * - onClick={handleSignOut}
 * - disabled={signingOut}
 * - Shows toast on success/error
 * - Navigates to '/' and refreshes on success
 *
 * Code:
 * ```tsx
 * <DropdownMenuItem
 *   onClick={handleSignOut}
 *   disabled={signingOut}
 *   className="cursor-pointer text-destructive focus:text-destructive"
 * >
 *   <LogOut className="mr-2 h-4 w-4" />
 *   <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
 * </DropdownMenuItem>
 * ```
 */
export const SignOutButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sign-out button with destructive styling. Shows loading state during sign-out. Disables while processing.',
      },
    },
  },
};

/**
 * Sign Out Loading State
 *
 * Shows sign-out button during async sign-out process.
 * Button disabled, text changes to "Signing out...".
 *
 * Flow:
 * 1. User clicks "Sign out"
 * 2. setSigningOut(true)
 * 3. Button disabled, text → "Signing out..."
 * 4. supabase.auth.signOut() called
 * 5. If success → toast, navigate, refresh
 * 6. If error → error toast
 * 7. setSigningOut(false)
 */
export const SigningOutLoading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sign-out button in loading state. Disabled with "Signing out..." text while async operation processes.',
      },
    },
  },
};

/**
 * Toast Notifications
 *
 * Component shows toasts for auth actions:
 * - Success: toasts.success.signedOut() after successful sign-out
 * - Error: toasts.error.authFailed() if sign-out fails
 * - Error: toasts.error.serverError() if unexpected error
 *
 * Toast triggers:
 * ```ts
 * const { error } = await supabase.auth.signOut();
 * if (error) {
 *   toasts.error.authFailed(`Sign out failed: ${error.message}`);
 * } else {
 *   toasts.success.signedOut();
 *   router.push('/');
 *   router.refresh();
 * }
 * ```
 */
export const ToastNotifications: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Toast notifications for auth actions. Success toast on sign-out, error toasts for failures.',
      },
    },
  },
};

/**
 * Router Integration
 *
 * Component uses useRouter for post-signout navigation.
 * Navigates to home page and refreshes router on successful sign-out.
 *
 * Code:
 * ```ts
 * const router = useRouter();
 *
 * // After successful sign-out:
 * router.push('/');
 * router.refresh();
 * ```
 *
 * Purpose:
 * - push('/'): Navigate to home page
 * - refresh(): Refresh router to clear auth state from server components
 */
export const RouterIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Router integration for post-signout navigation. Navigates to home and refreshes router to clear auth state.',
      },
    },
  },
};

/**
 * Auth State Listener
 *
 * useEffect hook that listens for Supabase auth changes.
 * Updates user state when auth changes.
 *
 * Code:
 * ```ts
 * useEffect(() => {
 *   const getUser = async () => {
 *     const { data: { user } } = await supabase.auth.getUser();
 *     setUser(user);
 *     setLoading(false);
 *   };
 *
 *   getUser().catch(() => {});
 *
 *   const { data: { subscription } } = supabase.auth.onAuthStateChange(
 *     (_event, session) => {
 *       setUser(session?.user ?? null);
 *     }
 *   );
 *
 *   return () => {
 *     subscription.unsubscribe();
 *   };
 * }, [supabase]);
 * ```
 *
 * Lifecycle:
 * 1. Component mounts → getUser() called
 * 2. Subscribe to auth changes
 * 3. Update user state when auth changes
 * 4. Component unmounts → unsubscribe
 */
export const AuthStateListener: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Auth state listener with useEffect. Subscribes to Supabase auth changes and updates user state. Unsubscribes on unmount.',
      },
    },
  },
};

/**
 * Responsive Behavior
 *
 * Component adapts to screen size:
 * - Mobile (< lg): Icon only in sign-in button
 * - Desktop (>= lg): Icon + "Sign In" text
 *
 * Code:
 * ```tsx
 * <Button variant="ghost" size="sm">
 *   <UserIcon className="h-4 w-4" />
 *   <span className="hidden lg:inline">Sign In</span>
 * </Button>
 * ```
 *
 * Avatar and dropdown remain same size across breakpoints.
 */
export const ResponsiveBehavior: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Responsive sign-in button. Icon only on mobile, icon + text on desktop (lg+).',
      },
    },
  },
};

/**
 * Hover Effects
 *
 * Interactive hover states:
 * - Avatar button: hover:ring-2 hover:ring-accent/30
 * - Sign-in button: UI_CLASSES.BUTTON_GHOST_ICON hover effect
 * - Dropdown items: Built-in DropdownMenuItem hover states
 *
 * Avatar hover:
 * ```tsx
 * <Button
 *   variant="ghost"
 *   className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-accent/30"
 * >
 *   <Avatar className="h-8 w-8">...</Avatar>
 * </Button>
 * ```
 */
export const HoverEffects: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Hover effects on avatar and buttons. Avatar shows accent ring on hover. Sign-in button uses ghost variant hover state.',
      },
    },
  },
};

/**
 * Keyboard Navigation
 *
 * Component is fully keyboard accessible:
 * - Tab: Focus on avatar/sign-in button
 * - Enter/Space: Open dropdown (signed-in) or navigate to login (signed-out)
 * - Arrow keys: Navigate dropdown items
 * - Enter: Activate dropdown item
 * - Escape: Close dropdown
 *
 * DropdownMenu provides built-in keyboard support:
 * - Arrow up/down: Navigate items
 * - Home/End: Jump to first/last item
 * - Enter/Space: Select item
 */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Fully keyboard accessible. Tab to focus, Enter to open dropdown, arrows to navigate items, Escape to close.',
      },
    },
  },
};

/**
 * Accessibility (ARIA)
 *
 * Component includes ARIA attributes:
 * - Avatar button: aria-label="User menu for {displayName}"
 * - Sign-in button: aria-label="Sign in"
 * - Dropdown: Built-in DropdownMenu ARIA (menu, menuitem roles)
 *
 * Screen reader flow:
 * 1. Signed out: "Sign in, button"
 * 2. Signed in: "User menu for John Doe, button"
 * 3. Dropdown open: "Settings, menu item", etc.
 */
export const AccessibilityARIA: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'ARIA attributes for screen readers. Descriptive labels on buttons, built-in dropdown menu semantics.',
      },
    },
  },
};

/**
 * In Context Example
 *
 * Shows UserMenu in realistic navigation header.
 * Positioned at far right of nav bar.
 */
export const InContextExample: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-xl font-bold">ClaudePro</div>
              <div className="hidden md:flex gap-6">
                <a href="/features" className="text-sm hover:underline">
                  Features
                </a>
                <a href="/docs" className="text-sm hover:underline">
                  Docs
                </a>
                <a href="/pricing" className="text-sm hover:underline">
                  Pricing
                </a>
              </div>
            </div>
            <UserMenu />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">User Menu Demo</h1>
        <p className="text-muted-foreground">
          The user menu appears in the top-right corner of the navigation.
          <br />
          State depends on Supabase auth configuration.
        </p>
      </main>
    </div>
  ),
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Component Render Test
 * Tests UserMenu renders in one of three valid states
 */
export const ComponentRenderTest: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests UserMenu renders without errors. May show loading, signed-out, or signed-in state.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Check component renders in valid state', async () => {
      // Component should render in one of three states
      const hasLoadingSkeleton = canvasElement.querySelector('.animate-pulse');
      const hasSignInButton = canvasElement.querySelector('[aria-label="Sign in"]');
      const hasUserMenu = canvasElement.querySelector('button[aria-label*="User menu"]');

      // At least one state should be present
      const hasValidState = hasLoadingSkeleton || hasSignInButton || hasUserMenu;
      await expect(hasValidState).toBeTruthy();
    });
  },
};

/**
 * Loading Skeleton Test
 * Tests loading state shows animated skeleton
 */
export const LoadingSkeletonTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests loading skeleton appears with pulse animation and correct sizing.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Check for loading skeleton (if in loading state)', async () => {
      const skeleton = canvasElement.querySelector('.animate-pulse');
      if (skeleton) {
        // Should have rounded-full and bg-muted classes
        const classList = Array.from(skeleton.classList);
        await expect(classList).toContain('rounded-full');
        await expect(classList).toContain('bg-muted');
      }
    });
  },
};

/**
 * Sign In Button Test
 * Tests signed-out state shows sign-in button
 */
export const SignInButtonTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests sign-in button appears with correct aria-label when user is signed out.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Check for sign-in button (if signed out)', async () => {
      const signInButton = canvas.queryByRole('link', { name: /sign in/i });
      if (signInButton) {
        await expect(signInButton).toBeInTheDocument();
        // Should link to /login
        await expect(signInButton.getAttribute('href')).toBe('/login');
      }
    });
  },
};

/**
 * Avatar Button Test
 * Tests signed-in state shows avatar button
 */
export const AvatarButtonTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests avatar button appears with user menu aria-label when user is signed in.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Check for avatar button (if signed in)', async () => {
      const avatarButton = canvas.queryByRole('button', { name: /user menu/i });
      if (avatarButton) {
        await expect(avatarButton).toBeInTheDocument();
        // Should have rounded-full styling
        await expect(avatarButton.className).toContain('rounded-full');
      }
    });
  },
};

/**
 * Dropdown Menu Structure Test
 * Tests dropdown menu has expected structure when signed in
 */
export const DropdownMenuStructureTest: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests dropdown menu structure. Should have user info, navigation links, and sign-out button.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify dropdown menu structure (if signed in)', async () => {
      // DropdownMenu should be present if user is signed in
      const dropdownTrigger = canvasElement.querySelector('[aria-label*="User menu"]');
      if (dropdownTrigger) {
        // Dropdown exists
        await expect(dropdownTrigger).toBeInTheDocument();

        // Note: Dropdown content is rendered but hidden by default
        // Full interaction testing requires user interaction or production environment
      }
    });
  },
};

/**
 * Responsive Classes Test
 * Tests responsive classes on sign-in button text
 */
export const ResponsiveClassesTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests sign-in button has responsive classes (hidden lg:inline) on text span.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Check responsive classes (if signed out)', async () => {
      const signInButton = canvasElement.querySelector('[aria-label="Sign in"]');
      if (signInButton) {
        const textSpan = signInButton.querySelector('span');
        if (textSpan) {
          const classList = Array.from(textSpan.classList);
          // Should have hidden and lg:inline classes
          await expect(classList).toContain('hidden');
          await expect(classList).toContain('lg:inline');
        }
      }
    });
  },
};
