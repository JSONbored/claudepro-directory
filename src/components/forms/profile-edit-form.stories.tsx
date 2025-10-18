import type { Meta, StoryObj } from '@storybook/react';
import { ProfileEditForm, RefreshProfileButton } from './profile-edit-form';

/**
 * Profile Edit Form Stories
 *
 * Comprehensive showcase of the profile edit form component with all field variants.
 * Demonstrates form validation, state management, and interaction patterns.
 *
 * **Component Features:**
 * - Profile information editing (name, bio, work, website, social links)
 * - Interests/skills tag management (max 10, max 30 chars each)
 * - Privacy settings (public profile toggle)
 * - Notification preferences (email on new followers)
 * - Character counting for bio field (500 char limit)
 * - Change tracking (enables/disables Save button)
 * - Cancel/reset functionality
 * - OAuth profile refresh button
 *
 * **Architecture:**
 * - Client component with useTransition for async actions
 * - SSR-safe with useId for unique field IDs
 * - Controlled form inputs with local state
 * - Server action integration via #lib/actions/user
 * - Toast notifications for success/error states
 *
 * **Validation Rules:**
 * - Name: Required, max 100 characters
 * - Bio: Optional, max 500 characters
 * - Work: Optional, max 100 characters
 * - Website: Optional, URL format validation
 * - Social X: Optional, URL format validation
 * - Interests: Max 10 items, max 30 chars each, no duplicates
 * - Public: Boolean (default: true)
 * - Follow Email: Boolean (default: true)
 *
 * **Production Standards:**
 * - TypeScript types (no runtime Zod validation)
 * - Server action mocking via #lib subpath imports
 * - Silent fallbacks for form errors
 * - SSR-safe with deterministic IDs
 */

const meta = {
  title: 'Forms/ProfileEditForm',
  component: ProfileEditForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Profile Edit Form Component** - Full-featured user profile editing with validation.

**Features:**
- Personal information fields (name, bio, work, website, social links)
- Interest/skill tag management with validation
- Privacy and notification toggles
- Character counting and validation feedback
- Change tracking with Save/Cancel actions
- OAuth profile refresh integration

**Form Fields:**
- \`name\`: Required, max 100 chars
- \`bio\`: Optional, max 500 chars (with counter)
- \`work\`: Optional, max 100 chars
- \`website\`: Optional, URL format
- \`social_x_link\`: Optional, URL format
- \`interests\`: Array, max 10 items, max 30 chars each
- \`public\`: Boolean toggle (default: true)
- \`follow_email\`: Boolean toggle (default: true)

**Interactions:**
- Type in fields to enable Save button
- Add interests with Enter key or Add button
- Remove interests with X button
- Toggle privacy/notification switches
- Cancel button resets to original values
- Save button submits form with useTransition

**Validation:**
- Real-time character counting for bio
- Interest length validation (max 30 chars)
- Interest count validation (max 10 items)
- Duplicate interest detection
- URL format validation (browser native)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProfileEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ==============================================================================
 * MOCK DATA
 * ==============================================================================
 */

/**
 * Empty profile data (new user)
 */
const emptyProfile = {
  id: 'new-user-123',
  name: '',
  email: 'newuser@example.com',
  bio: null,
  work: null,
  website: null,
  social_x_link: null,
  interests: null,
  public: true,
  follow_email: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Minimal profile data (basic user)
 */
const minimalProfile = {
  id: 'user-456',
  name: 'Alex Chen',
  email: 'alex@example.com',
  bio: null,
  work: null,
  website: null,
  social_x_link: null,
  interests: null,
  public: true,
  follow_email: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Filled profile data (existing user with all fields)
 */
const filledProfile = {
  id: 'user-789',
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  bio: 'Full-stack developer passionate about AI, automation, and building tools that make developers more productive. Currently exploring Claude Code and MCP servers.',
  work: 'Senior Software Engineer at TechCorp',
  website: 'https://sarahjohnson.dev',
  social_x_link: 'https://x.com/sarahj_dev',
  interests: ['TypeScript', 'React', 'Next.js', 'AI', 'Automation'],
  public: true,
  follow_email: true,
  created_at: '2024-06-15T12:00:00Z',
  updated_at: '2025-01-15T10:30:00Z',
};

/**
 * Profile with maximum interests (10 items)
 */
const maxInterestsProfile = {
  id: 'user-101',
  name: 'Jordan Kim',
  email: 'jordan@example.com',
  bio: 'Developer, designer, and perpetual learner. Love exploring new technologies and building side projects.',
  work: 'Freelance Developer & Designer',
  website: 'https://jordankim.io',
  social_x_link: 'https://x.com/jordankimdev',
  interests: [
    'TypeScript',
    'React',
    'Next.js',
    'TailwindCSS',
    'Node.js',
    'PostgreSQL',
    'AI/ML',
    'UI/UX Design',
    'Product Design',
    'Technical Writing',
  ],
  public: true,
  follow_email: true,
  created_at: '2024-03-20T08:00:00Z',
  updated_at: '2025-01-10T14:45:00Z',
};

/**
 * Profile with long bio (approaching character limit)
 */
const longBioProfile = {
  id: 'user-202',
  name: 'Morgan Taylor',
  email: 'morgan@example.com',
  bio: 'Experienced software engineer with over 10 years in the industry, specializing in full-stack web development, cloud infrastructure, and DevOps practices. Passionate about building scalable, maintainable systems and mentoring junior developers. Currently focused on AI-assisted development workflows and exploring how tools like Claude Code can transform the way we build software. Always learning, always shipping. Open to collaboration on interesting projects and speaking at tech events.',
  work: 'Lead Engineer at StartupXYZ',
  website: 'https://morgantaylor.com',
  social_x_link: 'https://x.com/morgantaylor',
  interests: ['TypeScript', 'DevOps', 'AI', 'Mentoring'],
  public: true,
  follow_email: true,
  created_at: '2023-08-10T16:20:00Z',
  updated_at: '2025-01-12T11:15:00Z',
};

/**
 * Private profile (public toggle off)
 */
const privateProfile = {
  id: 'user-303',
  name: 'Casey Brown',
  email: 'casey@example.com',
  bio: 'Software developer focused on privacy and security.',
  work: 'Security Engineer',
  website: null,
  social_x_link: null,
  interests: ['Security', 'Privacy', 'Cryptography'],
  public: false,
  follow_email: false,
  created_at: '2024-11-05T09:30:00Z',
  updated_at: '2025-01-08T13:20:00Z',
};

/**
 * Profile with no email notifications
 */
const noEmailProfile = {
  id: 'user-404',
  name: 'River Patel',
  email: 'river@example.com',
  bio: 'Developer who prefers in-app notifications only.',
  work: 'Mobile Developer',
  website: 'https://riverpatel.dev',
  social_x_link: 'https://x.com/riverpatel',
  interests: ['React Native', 'Mobile', 'iOS', 'Android'],
  public: true,
  follow_email: false,
  created_at: '2024-09-18T10:00:00Z',
  updated_at: '2025-01-14T15:30:00Z',
};

/**
 * ==============================================================================
 * EMPTY/MINIMAL STATE VARIANTS
 * ==============================================================================
 */

/**
 * Empty Profile - New User
 * Default state for brand new users with no profile data
 */
export const EmptyProfile: Story = {
  args: {
    profile: emptyProfile,
  },
  parameters: {
    docs: {
      description: {
        story: `
Empty profile for new users.

**Features Shown:**
- Empty form fields (except name)
- Default toggles (public: true, follow_email: true)
- No interests yet
- Save button disabled until changes made

**Use Case:**
First-time user profile setup after OAuth login.
        `,
      },
    },
  },
};

/**
 * Minimal Profile - Name Only
 * User with only basic information from OAuth
 */
export const MinimalProfile: Story = {
  args: {
    profile: minimalProfile,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal profile with just name from OAuth provider (GitHub, Google, etc.)',
      },
    },
  },
};

/**
 * ==============================================================================
 * FILLED STATE VARIANTS
 * ==============================================================================
 */

/**
 * Filled Profile - Complete Information
 * User with all fields populated
 */
export const FilledProfile: Story = {
  args: {
    profile: filledProfile,
  },
  parameters: {
    docs: {
      description: {
        story: `
Fully populated profile with all fields.

**Features Shown:**
- Name, bio, work, website, social links
- 5 interests/skills
- Character counter showing bio length
- All toggles enabled

**Use Case:**
Existing user editing their complete profile.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * INTERESTS VARIANTS
 * ==============================================================================
 */

/**
 * With Few Interests - 5 Items
 * Profile with moderate number of interests
 */
export const WithFewInterests: Story = {
  args: {
    profile: filledProfile,
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile with 5 interests, showing room to add more (5/10 displayed).',
      },
    },
  },
};

/**
 * With Maximum Interests - 10 Items
 * Profile at interest limit
 */
export const WithMaximumInterests: Story = {
  args: {
    profile: maxInterestsProfile,
  },
  parameters: {
    docs: {
      description: {
        story: `
Profile with maximum interests (10/10).

**Validation Shown:**
- Interest counter at limit (10/10)
- Add button functional but will show error toast if clicked
- Remove buttons functional to delete interests

**Behavior:**
Attempting to add 11th interest will show validation error toast.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * BIO LENGTH VARIANTS
 * ==============================================================================
 */

/**
 * With Long Bio - Approaching Limit
 * Profile with bio near 500 character limit
 */
export const WithLongBio: Story = {
  args: {
    profile: longBioProfile,
  },
  parameters: {
    docs: {
      description: {
        story: `
Profile with long bio approaching character limit.

**Features Shown:**
- Character counter showing ~470/500 characters
- Multi-line textarea with content
- Visual feedback on character usage

**Validation:**
Bio limited to 500 characters (browser maxLength attribute).
        `,
      },
    },
  },
};

/**
 * Empty Bio - Character Counter
 * Shows character counter at 0/500
 */
export const EmptyBio: Story = {
  args: {
    profile: minimalProfile,
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile with empty bio showing character counter at 0/500.',
      },
    },
  },
};

/**
 * ==============================================================================
 * PRIVACY VARIANTS
 * ==============================================================================
 */

/**
 * Private Profile - Public Toggle Off
 * User with private profile settings
 */
export const PrivateProfile: Story = {
  args: {
    profile: privateProfile,
  },
  parameters: {
    docs: {
      description: {
        story: `
Private profile with public toggle disabled.

**Features Shown:**
- Public profile toggle: OFF
- Email notifications toggle: OFF
- Privacy-focused user workflow

**Use Case:**
User who wants profile hidden from public view.
        `,
      },
    },
  },
};

/**
 * No Email Notifications - Follow Email Off
 * User who disabled follower email notifications
 */
export const NoEmailNotifications: Story = {
  args: {
    profile: noEmailProfile,
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile with email notifications disabled (follow_email: false).',
      },
    },
  },
};

/**
 * ==============================================================================
 * INTERACTION VARIANTS
 * ==============================================================================
 */

/**
 * Interactive Demo - All Features
 * Comprehensive demo with all features enabled
 */
export const InteractiveDemo: Story = {
  args: {
    profile: filledProfile,
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive demo with all features.

**Try These Interactions:**
1. Type in name/bio/work fields to see Save button enable
2. Add new interest (type and press Enter or click Add)
3. Remove interest (click X button)
4. Toggle public profile switch
5. Toggle email notifications switch
6. Click Save to see pending state
7. Click Cancel to reset to original values

**State Management:**
- \`hasChanges\`: Tracks if form is dirty
- \`isPending\`: Shows during async save operation
- Character counting: Updates in real-time
- Interest validation: Immediate feedback

**Server Actions:**
Mock \`updateProfile\` action simulates 500ms async operation.
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * VALIDATION STATE VARIANTS
 * ==============================================================================
 */

/**
 * Validation Showcase - All Limits
 * Shows all validation rules and limits
 */
export const ValidationShowcase: Story = {
  args: {
    profile: maxInterestsProfile,
  },
  parameters: {
    docs: {
      description: {
        story: `
Validation rules showcase.

**Validation Rules Demonstrated:**
- Name: Required (has asterisk), max 100 chars
- Bio: Optional, max 500 chars (counter shown)
- Work: Optional, max 100 chars
- Website: Optional, URL format
- Social X: Optional, URL format
- Interests: Max 10 items (10/10 shown), max 30 chars each
- Public: Boolean toggle
- Follow Email: Boolean toggle

**Error Scenarios:**
- Adding 11th interest → Toast error
- Adding duplicate interest → Toast error
- Adding interest >30 chars → Toast error
- Invalid URL format → Browser validation

**Success Scenarios:**
- Valid form submission → Success toast
- Profile refresh from OAuth → Success toast
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * REFRESH BUTTON VARIANT
 * ==============================================================================
 */

/**
 * OAuth Refresh Button - Standalone
 * Shows the RefreshProfileButton component
 */
export const RefreshButton: Story = {
  render: () => <RefreshProfileButton providerLabel="GitHub" />,
  parameters: {
    docs: {
      description: {
        story: `
Standalone OAuth profile refresh button.

**Features:**
- Triggers \`refreshProfileFromOAuth\` server action
- Shows pending state ("Refreshing...")
- Success/error toast feedback
- Simulates 800ms async operation

**Use Case:**
Allows users to re-sync profile data from OAuth provider (GitHub, Google, etc.).
        `,
      },
    },
  },
};

/**
 * ==============================================================================
 * RESPONSIVE VARIANTS
 * ==============================================================================
 */

/**
 * Mobile Viewport - Form Layout
 */
export const MobileViewport: Story = {
  args: {
    profile: filledProfile,
  },
  globals: {
    viewport: { value: 'mobile1' },
  },
  parameters: {
    docs: {
      description: {
        story: `
Profile edit form on mobile viewport.

**Responsive Behavior:**
- Full-width form fields
- Touch-optimized inputs
- Interest tags wrap to multiple lines
- Save/Cancel buttons stack or flex-wrap
        `,
      },
    },
  },
};

/**
 * Tablet Viewport - Form Layout
 */
export const TabletViewport: Story = {
  args: {
    profile: filledProfile,
  },
  globals: {
    viewport: { value: 'tablet' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form layout on tablet with optimized spacing.',
      },
    },
  },
};

/**
 * ==============================================================================
 * COMPREHENSIVE SHOWCASE
 * ==============================================================================
 */

/**
 * All Variants Comparison
 */
export const AllVariantsComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Empty Profile (New User)</h3>
        <div className="max-w-2xl">
          <ProfileEditForm profile={emptyProfile} />
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold mb-3">Filled Profile (All Fields)</h3>
        <div className="max-w-2xl">
          <ProfileEditForm profile={filledProfile} />
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold mb-3">Maximum Interests (10/10)</h3>
        <div className="max-w-2xl">
          <ProfileEditForm profile={maxInterestsProfile} />
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold mb-3">Private Profile</h3>
        <div className="max-w-2xl">
          <ProfileEditForm profile={privateProfile} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all major profile variants.',
      },
    },
  },
};

/**
 * MobileSmall: Small Mobile Viewport (320px)
 * Tests component on smallest modern mobile devices
 */
export const MobileSmall: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
};

/**
 * MobileLarge: Large Mobile Viewport (414px)
 * Tests component on larger modern mobile devices
 */
export const MobileLarge: Story = {
  globals: {
    viewport: { value: 'mobile2' },
  },
};

/**
 * DarkTheme: Dark Mode Theme
 * Tests component appearance in dark mode
 */
export const DarkTheme: Story = {
  globals: {
    theme: 'dark',
  },
};

/**
 * LightTheme: Light Mode Theme
 * Tests component appearance in light mode
 */
export const LightTheme: Story = {
  globals: {
    theme: 'light',
  },
};
