/**
 * Centralized Loading Skeleton Configuration
 *
 * Maps all routes to their loading skeleton configurations.
 * This is the single source of truth for all loading skeletons across the application.
 *
 * ## Architecture
 *
 * **Factory Pattern:** Most routes use factory functions that generate skeleton components
 * based on configuration. This ensures consistency and reduces code duplication.
 *
 * **Custom Components:** Some routes with unique layouts use custom skeleton components
 * that are specifically designed to match their exact page structure.
 *
 * ## Factory Types
 *
 * ### 1. Form Factory (`createFormPageLoading`)
 * **Use for:** Pages with form inputs, edit/create pages
 * **Examples:** `/account/companies/[id]/edit`, `/account/jobs/new`, `/login`
 * **Config options:** `title`, `cardCount`, `fieldsPerCard`, `showActions`, `showBackButton`
 *
 * ### 2. List Factory (`createListPageLoading`)
 * **Use for:** Pages displaying lists of items (cards, grids, tables)
 * **Examples:** `/account/companies`, `/account/jobs`, `/community/directory`
 * **Config options:** `title`, `variant` (cards/list/grid), `itemCount`, `columns`, `showSearch`
 *
 * ### 3. Detail Factory (`createDetailPageLoading`)
 * **Use for:** Detail/analytics pages with stats, charts, and content cards
 * **Examples:** `/account/jobs/[id]/analytics`, `/account/sponsorships/[id]/analytics`
 * **Config options:** `showBackButton`, `showBadges`, `showStats`, `showChart`, `cardCount`
 *
 * ### 4. Static Factory (`createStaticPageLoading`)
 * **Use for:** Static content pages (privacy, terms, accessibility)
 * **Examples:** `/privacy`, `/terms`, `/cookies`, `/accessibility`
 * **Config options:** `title`, `centered`, `sections`, `showCards`
 *
 * ### 5. Dashboard Factory (`createDashboardPageLoading`)
 * **Use for:** Dashboard pages with stats cards and quick actions
 * **Examples:** `/account`, `/account/activity`
 * **Config options:** `title`, `statsCount`, `statsColumns`, `showQuickActions`, `showContentCards`
 *
 * ### 6. Profile Factory (`createProfilePageLoading`)
 * **Use for:** Profile/settings pages with avatar, form fields, and cards
 * **Examples:** `/account/settings`, `/account/settings/mfa`, `/account/connected-accounts`
 * **Config options:** `title`, `showAvatar`, `formFieldsCount`, `showCards`, `cardCount`
 *
 * ### 7. Contact Factory (`createContactPageLoading`)
 * **Use for:** Contact/marketing pages with cards grid and prose sections
 * **Examples:** `/contact`, `/help`, `/consulting`, `/tools/config-recommender`
 * **Config options:** `title`, `centered`, `cardsCount`, `cardsPerRow`, `showProseSections`
 *
 * ### 8. Custom Components
 * **Use for:** Pages with unique layouts that don't fit factory patterns
 * **Examples:** `/submit`, `/companies/[slug]`, `/changelog`, category pages, detail pages
 * **Components:** `SubmitPageLoading`, `CompanyProfileLoading`, `ChangelogListLoading`, `CategoryLoading`, `DetailPageLoading`
 *
 * ## Complete Route-to-Factory Mapping
 *
 * ### Account Form Pages (6 routes)
 * - `/account/companies/[id]/edit` → `createFormPageLoading` (2 cards, 4+3 fields)
 * - `/account/companies/new` → `createFormPageLoading` (2 cards, 4+3 fields)
 * - `/account/jobs/[id]/edit` → `createFormPageLoading` (1 card, 8 fields)
 * - `/account/jobs/new` → `createFormPageLoading` (1 card, 8 fields)
 * - `/account/library/[slug]/edit` → `createFormPageLoading` (1 card, 4 fields, back button)
 * - `/account/library/new` → `createFormPageLoading` (1 card, 4 fields, back button)
 *
 * ### Account List Pages (5 routes)
 * - `/account/companies` → `createListPageLoading` (cards variant, 1 column)
 * - `/account/jobs` → `createListPageLoading` (cards variant, 1 column)
 * - `/account/library` → `createListPageLoading` (grid variant, 3 columns, tabs)
 * - `/account/sponsorships` → `createListPageLoading` (cards variant, 1 column)
 * - `/account/submissions` → `createListPageLoading` (grid variant, 3 columns)
 *
 * ### Account Detail/Analytics Pages (3 routes)
 * - `/account/jobs/[id]/analytics` → `createDetailPageLoading` (stats + chart)
 * - `/account/sponsorships/[id]/analytics` → `createDetailPageLoading` (stats + chart + badges)
 * - `/tools/config-recommender/results/[id]` → `createDetailPageLoading` (simple card)
 *
 * ### Account Dashboard Pages (2 routes)
 * - `/account` → `createDashboardPageLoading` (3 stats, 3 quick actions)
 * - `/account/activity` → `createDashboardPageLoading` (1 stat, 1 timeline card)
 *
 * ### Account Profile/Settings Pages (3 routes)
 * - `/account/settings` → `createProfilePageLoading` (avatar + form + cards)
 * - `/account/settings/mfa` → `createProfilePageLoading` (2 cards, no avatar)
 * - `/account/connected-accounts` → `createProfilePageLoading` (1 card, no avatar)
 *
 * ### Static Content Pages (4 routes)
 * - `/privacy` → `createStaticPageLoading` (centered, 8 sections)
 * - `/terms` → `createStaticPageLoading` (not centered, 6 sections)
 * - `/cookies` → `createStaticPageLoading` (centered, 6 sections)
 * - `/accessibility` → `createStaticPageLoading` (not centered, 8 sections)
 *
 * ### Contact/Marketing Pages (4 routes)
 * - `/contact` → `createContactPageLoading` (4 cards, 2 columns, prose sections)
 * - `/help` → `createContactPageLoading` (4 cards, 4 columns, prose sections)
 * - `/consulting` → `createContactPageLoading` (4 cards, 2 columns, prose sections)
 * - `/tools/config-recommender` → `createContactPageLoading` (3 cards, 3 columns, no prose)
 *
 * ### Submit Pages (2 routes)
 * - `/submit` → `SubmitPageLoading` (custom: hero + form + sidebar)
 * - `/submit/wizard` → `createFormPageLoading` (1 card, 8 fields)
 *
 * ### Company Pages (2 routes)
 * - `/companies` → `CategoryLoading` (custom: category list preset)
 * - `/companies/[slug]` → `CompanyProfileLoading` (custom: header + jobs + stats)
 *
 * ### Changelog Pages (2 routes)
 * - `/changelog` → `ChangelogListLoading` (custom: timeline view)
 * - `/changelog/[slug]` → `DetailPageLoading` (custom: changelog entry preset)
 *
 * ### Community Pages (2 routes)
 * - `/community` → `CategoryLoading` (custom: category list preset)
 * - `/community/directory` → `createListPageLoading` (grid variant, 3 columns, search)
 *
 * ### Category Pages (14 routes - all use CategoryLoading)
 * - `/[category]` → `CategoryLoading` (dynamic route for all categories)
 * - `/agents` → `CategoryLoading`
 * - `/mcp` → `CategoryLoading`
 * - `/commands` → `CategoryLoading`
 * - `/rules` → `CategoryLoading`
 * - `/hooks` → `CategoryLoading`
 * - `/statuslines` → `CategoryLoading`
 * - `/skills` → `CategoryLoading`
 * - `/collections` → `CategoryLoading`
 * - `/trending` → `CategoryLoading`
 * - `/search` → `CategoryLoading`
 * - `/jobs` → `CategoryLoading`
 * - `/companies` → `CategoryLoading`
 * - `/partner` → `CategoryLoading`
 *
 * ### Detail Pages (6 routes - all use DetailPageLoading or variants)
 * - `/[category]/[slug]` → `DetailPageLoading` (content detail preset)
 * - `/changelog/[slug]` → `DetailPageLoading` (changelog entry preset)
 * - `/jobs/[slug]` → `DetailPageLoading` (job detail preset)
 * - `/u/[slug]` → `DetailPageLoading` (user profile preset)
 * - `/account/library/[slug]` → `DetailPageLoading` (collection detail preset)
 * - `/u/[slug]/collections/[collectionSlug]` → `DetailPageLoading` (public collection preset)
 *
 * ### Auth Pages (2 routes)
 * - `/login` → `createFormPageLoading` (1 card, 3 fields, narrow)
 * - `/oauth/consent` → `createFormPageLoading` (1 card, 4 fields, narrow)
 *
 * ### Root Page (1 route)
 * - `/` → `DefaultLoading` (fallback spinner)
 *
 * ## Usage Instructions
 *
 * ### Adding a New Route
 *
 * 1. **Determine the page type:**
 *    - Form page? → Use `createFormPageLoading`
 *    - List page? → Use `createListPageLoading`
 *    - Detail page? → Use `createDetailPageLoading`
 *    - Static content? → Use `createStaticPageLoading`
 *    - Dashboard? → Use `createDashboardPageLoading`
 *    - Profile/settings? → Use `createProfilePageLoading`
 *    - Contact/marketing? → Use `createContactPageLoading`
 *    - Unique layout? → Create custom component or use existing preset
 *
 * 2. **Add configuration to this file:**
 *    ```typescript
 *    '/new/route': {
 *      factory: 'form', // or 'list', 'detail', etc.
 *      config: {
 *        // Factory-specific options
 *      },
 *    },
 *    ```
 *
 * 3. **Create loading.tsx file:**
 *    ```typescript
 *    import { getLoadingComponent } from '@heyclaude/web-runtime/ui';
 *    export default getLoadingComponent('/new/route');
 *    ```
 *
 * ### Updating an Existing Route
 *
 * 1. **Find the route** in this file
 * 2. **Update the config** object
 * 3. **All matching routes** automatically use the new config
 * 4. **No need to update** individual loading.tsx files
 *
 * ### When to Use Custom Components
 *
 * Use custom components (`factory: 'custom'`) when:
 * - Page has a unique layout that doesn't fit any factory pattern
 * - Page has multiple distinct sections (e.g., hero + form + sidebar)
 * - Page requires specific skeleton structure that factories can't provide
 *
 * **Examples of justified custom components:**
 * - `SubmitPageLoading` - Hero + form + sidebar (3 distinct sections)
 * - `CompanyProfileLoading` - Header + jobs list + stats sidebar (complex layout)
 * - `ChangelogListLoading` - Timeline view (unique structure)
 * - `CategoryLoading` - Preset for all category pages (reusable)
 * - `DetailPageLoading` - Preset for all detail pages (reusable)
 *
 * ## Animation System
 *
 * All skeletons use consistent Motion.dev spring physics animations:
 * - **Shimmer:** `stiffness: 200, damping: 30, mass: 0.8` (organic, liquid feel)
 * - **Stagger/Mount:** `stiffness: 400, damping: 25, mass: 0.5` (snappy, responsive)
 * - **prefers-reduced-motion:** All animations respect user preferences
 * - **GPU-accelerated:** Uses `transform` properties for performance
 *
 * @see {@link ./loading-factory.tsx} - Factory function implementations
 * @see {@link ./loading-registry.tsx} - Route resolver and component registry
 * @see {@link ./loading-skeleton.tsx} - Base skeleton components with animations
 *
 * @todo Consider creating a factory for multi-step wizard pages (currently using form factory)
 * @todo Consider creating a factory for search results pages (currently using CategoryLoading)
 * @todo Consider creating a factory for timeline views (currently using ChangelogListLoading custom)
 * @todo Add support for nested routes with multiple loading states
 * @todo Consider adding a factory for pages with tabs/segmented controls
 *
 * @future Future Enhancements:
 * - Add support for skeleton variants (light/dark mode specific skeletons)
 * - Add support for skeleton themes (different animation styles)
 * - Add support for skeleton presets (quick configs for common patterns)
 * - Add support for skeleton composition (combining multiple factories)
 * - Add support for skeleton inheritance (extending existing configs)
 * - Add support for skeleton overrides (route-specific customizations)
 *
 * @module loading-config
 */

import type {
  FormPageLoadingConfig,
  ListPageLoadingConfig,
  DetailPageLoadingConfig,
  StaticPageLoadingConfig,
  DashboardPageLoadingConfig,
  ProfilePageLoadingConfig,
  ContactPageLoadingConfig,
} from './loading-factory';

/**
 * Loading configuration type union.
 *
 * Represents all possible loading skeleton configurations for routes.
 * Each factory type has its own configuration interface.
 *
 * @see {@link FormPageLoadingConfig} - Form page configuration
 * @see {@link ListPageLoadingConfig} - List page configuration
 * @see {@link DetailPageLoadingConfig} - Detail page configuration
 * @see {@link StaticPageLoadingConfig} - Static page configuration
 * @see {@link DashboardPageLoadingConfig} - Dashboard page configuration
 * @see {@link ProfilePageLoadingConfig} - Profile page configuration
 * @see {@link ContactPageLoadingConfig} - Contact page configuration
 */
export type LoadingConfig =
  | { factory: 'form'; config: FormPageLoadingConfig }
  | { factory: 'list'; config: ListPageLoadingConfig }
  | { factory: 'detail'; config: DetailPageLoadingConfig }
  | { factory: 'static'; config: StaticPageLoadingConfig }
  | { factory: 'dashboard'; config: DashboardPageLoadingConfig }
  | { factory: 'profile'; config: ProfilePageLoadingConfig }
  | { factory: 'contact'; config: ContactPageLoadingConfig }
  | { factory: 'custom'; customComponent: string };

/**
 * Route-to-loading-configuration mapping.
 *
 * Maps all application routes to their loading skeleton configurations.
 * Supports dynamic route patterns with `[id]`, `[slug]`, and `[category]` segments.
 *
 * **Pattern Matching:**
 * - Exact routes are matched first (e.g., `/account/companies`)
 * - Dynamic patterns are matched second (e.g., `/account/companies/[id]/edit`)
 * - Patterns use segment matching: `[id]` matches any segment
 *
 * **Route Patterns:**
 * - `[id]` - Matches any segment (e.g., `/account/companies/123/edit`)
 * - `[slug]` - Matches any segment (e.g., `/companies/acme-corp`)
 * - `[category]` - Matches any category (e.g., `/agents`, `/mcp`)
 *
 * **Total Routes Configured:** 46+ routes
 * **Factory Usage:**
 * - Form: 8 routes
 * - List: 6 routes
 * - Detail: 3 routes
 * - Static: 4 routes
 * - Dashboard: 2 routes
 * - Profile: 3 routes
 * - Contact: 4 routes
 * - Custom: 16+ routes (category pages, detail pages, special layouts)
 *
 * @see {@link getLoadingComponent} - Function that resolves routes to components
 * @see {@link LOADING_CONFIGS} - The actual configuration object
 */
export const LOADING_CONFIGS: Record<string, LoadingConfig> = {
  // ============================================================================
  // Account Form Pages (6 routes)
  // ============================================================================
  /**
   * Edit Company Page
   * @route /account/companies/[id]/edit
   * @factory createFormPageLoading
   * @config 2 cards (Company Information, Company Details), 4+3 fields, actions, max-width 4xl
   */
  '/account/companies/[id]/edit': {
    factory: 'form',
    config: {
      title: 'Edit Company',
      cardCount: 2,
      fieldsPerCard: [4, 3],
      showActions: true,
      cardTitles: ['Company Information', 'Company Details'],
      maxWidth: '4xl',
    },
  },
  /**
   * New Company Page
   * @route /account/companies/new
   * @factory createFormPageLoading
   * @config 2 cards (Company Information, Company Details), 4+3 fields, actions, max-width 4xl
   */
  '/account/companies/new': {
    factory: 'form',
    config: {
      title: 'New Company',
      cardCount: 2,
      fieldsPerCard: [4, 3],
      showActions: true,
      cardTitles: ['Company Information', 'Company Details'],
      maxWidth: '4xl',
    },
  },
  /**
   * Edit Job Page
   * @route /account/jobs/[id]/edit
   * @factory createFormPageLoading
   * @config 1 card, 8 fields, actions
   */
  '/account/jobs/[id]/edit': {
    factory: 'form',
    config: {
      title: 'Edit Job',
      cardCount: 1,
      fieldsPerCard: [8],
      showActions: true,
    },
  },
  /**
   * New Job Page
   * @route /account/jobs/new
   * @factory createFormPageLoading
   * @config 1 card, 8 fields, actions
   */
  '/account/jobs/new': {
    factory: 'form',
    config: {
      title: 'New Job',
      cardCount: 1,
      fieldsPerCard: [8],
      showActions: true,
    },
  },
  /**
   * Edit Collection Page
   * @route /account/library/[slug]/edit
   * @factory createFormPageLoading
   * @config 1 card, 4 fields, actions, back button
   */
  '/account/library/[slug]/edit': {
    factory: 'form',
    config: {
      title: 'Edit Collection',
      cardCount: 1,
      fieldsPerCard: [4],
      showActions: true,
      showBackButton: true,
    },
  },
  /**
   * New Collection Page
   * @route /account/library/new
   * @factory createFormPageLoading
   * @config 1 card, 4 fields, actions, back button
   */
  '/account/library/new': {
    factory: 'form',
    config: {
      title: 'New Collection',
      cardCount: 1,
      fieldsPerCard: [4],
      showActions: true,
      showBackButton: true,
    },
  },

  // ============================================================================
  // Account List Pages (5 routes)
  // ============================================================================
  /**
   * My Companies Page
   * @route /account/companies
   * @factory createListPageLoading
   * @config Cards variant, 1 column, 4 items, action button, max-width 6xl
   */
  '/account/companies': {
    factory: 'list',
    config: {
      title: 'My Companies',
      variant: 'cards',
      itemCount: 4,
      showActionButton: true,
      columns: 1,
      maxWidth: '6xl',
    },
  },
  /**
   * My Jobs Page
   * @route /account/jobs
   * @factory createListPageLoading
   * @config Cards variant, 1 column, 4 items, action button
   */
  '/account/jobs': {
    factory: 'list',
    config: {
      title: 'My Jobs',
      variant: 'cards',
      itemCount: 4,
      showActionButton: true,
      columns: 1,
    },
  },
  /**
   * My Library Page
   * @route /account/library
   * @factory createListPageLoading
   * @config Grid variant, 3 columns, 6 items, action button, tabs
   */
  '/account/library': {
    factory: 'list',
    config: {
      title: 'My Library',
      variant: 'grid',
      itemCount: 6,
      showActionButton: true,
      columns: 3,
      showTabs: true,
    },
  },
  /**
   * My Sponsorships Page
   * @route /account/sponsorships
   * @factory createListPageLoading
   * @config Cards variant, 1 column, 3 items, action button, max-width 6xl
   */
  '/account/sponsorships': {
    factory: 'list',
    config: {
      title: 'My Sponsorships',
      variant: 'cards',
      itemCount: 3,
      showActionButton: true,
      columns: 1,
      maxWidth: '6xl',
    },
  },
  /**
   * My Submissions Page
   * @route /account/submissions
   * @factory createListPageLoading
   * @config Grid variant, 3 columns, 6 items, no action button
   */
  '/account/submissions': {
    factory: 'list',
    config: {
      title: 'My Submissions',
      variant: 'grid',
      itemCount: 6,
      showActionButton: false,
      columns: 3,
    },
  },

  // ============================================================================
  // Account Detail/Analytics Pages (3 routes)
  // ============================================================================
  /**
   * Job Analytics Page
   * @route /account/jobs/[id]/analytics
   * @factory createDetailPageLoading
   * @config Back button, stats (4), chart, 1 card
   */
  '/account/jobs/[id]/analytics': {
    factory: 'detail',
    config: {
      showBackButton: true,
      showBadges: false,
      cardCount: 1,
      showStats: true,
      statsCount: 4,
      showChart: true,
    },
  },
  /**
   * Sponsorship Analytics Page
   * @route /account/sponsorships/[id]/analytics
   * @factory createDetailPageLoading
   * @config Badges, stats (4), chart, 1 card, max-width 6xl
   */
  '/account/sponsorships/[id]/analytics': {
    factory: 'detail',
    config: {
      showBackButton: false,
      showBadges: true,
      cardCount: 1,
      showStats: true,
      statsCount: 4,
      showChart: true,
      maxWidth: '6xl',
    },
  },
  /**
   * Config Recommender Results Page
   * @route /tools/config-recommender/results/[id]
   * @factory createDetailPageLoading
   * @config Simple card, no stats, no chart
   */
  '/tools/config-recommender/results/[id]': {
    factory: 'detail',
    config: {
      showBackButton: false,
      showBadges: false,
      cardCount: 1,
      showStats: false,
      showChart: false,
    },
  },

  // ============================================================================
  // Account Dashboard Pages (2 routes)
  // ============================================================================
  /**
   * Account Dashboard Page
   * @route /account
   * @factory createDashboardPageLoading
   * @config 3 stats (3 columns), 3 quick actions, no content cards
   */
  '/account': {
    factory: 'dashboard',
    config: {
      title: 'Dashboard',
      statsCount: 3,
      statsColumns: 3,
      showQuickActions: true,
      quickActionsCount: 3,
      showContentCards: false,
    },
  },
  /**
   * Account Activity Page
   * @route /account/activity
   * @factory createDashboardPageLoading
   * @config 1 stat (2 columns), 1 timeline content card
   */
  '/account/activity': {
    factory: 'dashboard',
    config: {
      title: 'Activity',
      statsCount: 1,
      statsColumns: 2,
      showQuickActions: false,
      showContentCards: true,
      contentCardCount: 1, // Timeline card
    },
  },

  // ============================================================================
  // Account Profile/Settings Pages (3 routes)
  // ============================================================================
  /**
   * Account Settings Page
   * @route /account/settings
   * @factory createProfilePageLoading
   * @config Avatar, 4 form fields, 1 card
   */
  '/account/settings': {
    factory: 'profile',
    config: {
      title: 'Settings',
      showAvatar: true,
      formFieldsCount: 4,
      showCards: true,
      cardCount: 1,
    },
  },
  /**
   * MFA Settings Page
   * @route /account/settings/mfa
   * @factory createProfilePageLoading
   * @config No avatar, 2 cards (MFA Factors, How it works), max-width 4xl
   */
  '/account/settings/mfa': {
    factory: 'profile',
    config: {
      title: 'MFA Settings',
      showAvatar: false,
      showCards: true,
      cardCount: 2,
      cardTitles: ['MFA Factors', 'How it works'],
      maxWidth: '4xl',
    },
  },
  /**
   * Connected Accounts Page
   * @route /account/connected-accounts
   * @factory createProfilePageLoading
   * @config No avatar, 1 card with account list
   */
  '/account/connected-accounts': {
    factory: 'profile',
    config: {
      title: 'Connected Accounts',
      showAvatar: false,
      showCards: true,
      cardCount: 1,
    },
  },

  // ============================================================================
  // Static Content Pages (4 routes)
  // ============================================================================
  /**
   * Privacy Policy Page
   * @route /privacy
   * @factory createStaticPageLoading
   * @config Centered, 8 sections, no cards, max-width 4xl
   */
  '/privacy': {
    factory: 'static',
    config: {
      title: 'Privacy Policy',
      centered: true,
      sections: 8,
      showCards: false,
      maxWidth: '4xl',
    },
  },
  /**
   * Terms of Service Page
   * @route /terms
   * @factory createStaticPageLoading
   * @config Not centered, 6 sections, no cards, max-width 4xl
   */
  '/terms': {
    factory: 'static',
    config: {
      title: 'Terms of Service',
      centered: false,
      sections: 6,
      showCards: false,
      maxWidth: '4xl',
    },
  },
  /**
   * Cookie Policy Page
   * @route /cookies
   * @factory createStaticPageLoading
   * @config Centered, 6 sections, no cards, max-width 4xl
   */
  '/cookies': {
    factory: 'static',
    config: {
      title: 'Cookie Policy',
      centered: true,
      sections: 6,
      showCards: false,
      maxWidth: '4xl',
    },
  },
  /**
   * Accessibility Statement Page
   * @route /accessibility
   * @factory createStaticPageLoading
   * @config Not centered, 8 sections, no cards, max-width 4xl
   */
  '/accessibility': {
    factory: 'static',
    config: {
      title: 'Accessibility Statement',
      centered: false,
      sections: 8,
      showCards: false,
      maxWidth: '4xl',
    },
  },

  // ============================================================================
  // Contact/Marketing Pages (4 routes)
  // ============================================================================
  /**
   * Contact Us Page
   * @route /contact
   * @factory createContactPageLoading
   * @config Centered, 4 cards (2 columns), prose sections (3), max-width 4xl
   */
  '/contact': {
    factory: 'contact',
    config: {
      title: 'Contact Us',
      centered: true,
      cardsCount: 4,
      cardsPerRow: 2,
      showProseSections: true,
      proseSectionsCount: 3,
      maxWidth: '4xl',
    },
  },
  /**
   * Help Center Page
   * @route /help
   * @factory createContactPageLoading
   * @config Centered, 4 cards (4 columns), prose sections (6), max-width 6xl
   */
  '/help': {
    factory: 'contact',
    config: {
      title: 'Help Center',
      centered: true,
      cardsCount: 4,
      cardsPerRow: 4,
      showProseSections: true,
      proseSectionsCount: 6,
      maxWidth: '6xl',
    },
  },
  /**
   * Consulting Services Page
   * @route /consulting
   * @factory createContactPageLoading
   * @config Centered, 4 cards (2 columns), prose sections (4), max-width 6xl
   */
  '/consulting': {
    factory: 'contact',
    config: {
      title: 'Consulting Services',
      centered: true,
      cardsCount: 4,
      cardsPerRow: 2,
      showProseSections: true,
      proseSectionsCount: 4,
      maxWidth: '6xl',
    },
  },
  /**
   * Configuration Recommender Page
   * @route /tools/config-recommender
   * @factory createContactPageLoading
   * @config Centered, 3 cards (3 columns), no prose sections, max-width 4xl
   */
  '/tools/config-recommender': {
    factory: 'contact',
    config: {
      title: 'Configuration Recommender',
      centered: true,
      cardsCount: 3,
      cardsPerRow: 3,
      showProseSections: false,
      maxWidth: '4xl',
    },
  },

  // ============================================================================
  // Submit Pages (2 routes)
  // ============================================================================
  /**
   * Submit Content Page
   * @route /submit
   * @factory custom (SubmitPageLoading)
   * @reason Complex layout: hero section + form (left) + sidebar (right)
   * @see {@link SubmitPageLoading} - Custom component matching exact page layout
   */
  '/submit': {
    factory: 'custom',
    customComponent: 'SubmitPageLoading',
  },
  /**
   * Submit Wizard Page
   * @route /submit/wizard
   * @factory createFormPageLoading
   * @config 1 card, 8 fields, actions, max-width 6xl
   */
  '/submit/wizard': {
    factory: 'form',
    config: {
      title: 'Submit Content',
      cardCount: 1,
      fieldsPerCard: [8],
      showActions: true,
      maxWidth: '6xl',
    },
  },

  // ============================================================================
  // Company Pages (2 routes)
  // ============================================================================
  /**
   * Companies List Page
   * @route /companies
   * @factory custom (CategoryLoading)
   * @reason Uses category list preset for consistency
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/companies': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Company Profile Page
   * @route /companies/[slug]
   * @factory custom (CompanyProfileLoading)
   * @reason Complex layout: header + jobs list (left) + stats sidebar (right)
   * @see {@link CompanyProfileLoading} - Custom component matching exact page layout
   */
  '/companies/[slug]': {
    factory: 'custom',
    customComponent: 'CompanyProfileLoading',
  },

  // ============================================================================
  // Changelog Pages (2 routes)
  // ============================================================================
  /**
   * Changelog List Page
   * @route /changelog
   * @factory custom (ChangelogListLoading)
   * @reason Unique timeline view layout
   * @see {@link ChangelogListLoading} - Custom component with timeline structure
   */
  '/changelog': {
    factory: 'custom',
    customComponent: 'ChangelogListLoading',
  },
  /**
   * Changelog Entry Page
   * @route /changelog/[slug]
   * @factory custom (DetailPageLoading)
   * @reason Uses detail page preset (changelog-specific structure handled by preset)
   * @see {@link DetailPageLoading} - Preset component for detail pages
   */
  '/changelog/[slug]': {
    factory: 'custom',
    customComponent: 'ChangelogEntryLoading',
  },

  // ============================================================================
  // Community Pages (2 routes)
  // ============================================================================
  /**
   * Community List Page
   * @route /community
   * @factory custom (CategoryLoading)
   * @reason Uses category list preset for consistency
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/community': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Community Directory Page
   * @route /community/directory
   * @factory createListPageLoading
   * @config Grid variant, 3 columns, 12 items, search bar, max-width 6xl
   */
  '/community/directory': {
    factory: 'list',
    config: {
      title: 'Community Directory',
      variant: 'grid',
      itemCount: 12,
      showActionButton: false,
      columns: 3,
      showSearch: true,
      maxWidth: '6xl',
    },
  },

  // ============================================================================
  // Category Pages (14 routes - all use CategoryLoading preset)
  // ============================================================================
  /**
   * Dynamic Category Route
   * @route /[category]
   * @factory custom (CategoryLoading)
   * @reason Handles all dynamic category routes (agents, mcp, commands, etc.)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/[category]': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Agents Category Page
   * @route /agents
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/agents': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * MCP Category Page
   * @route /mcp
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/mcp': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Commands Category Page
   * @route /commands
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/commands': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Rules Category Page
   * @route /rules
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/rules': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Hooks Category Page
   * @route /hooks
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/hooks': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Statuslines Category Page
   * @route /statuslines
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/statuslines': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Skills Category Page
   * @route /skills
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/skills': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Collections Category Page
   * @route /collections
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/collections': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Trending Category Page
   * @route /trending
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/trending': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Search Category Page
   * @route /search
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/search': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Jobs Category Page
   * @route /jobs
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/jobs': { factory: 'custom', customComponent: 'CategoryLoading' },
  /**
   * Partner Category Page
   * @route /partner
   * @factory custom (CategoryLoading)
   * @see {@link CategoryLoading} - Preset component for category pages
   */
  '/partner': { factory: 'custom', customComponent: 'CategoryLoading' },

  // ============================================================================
  // Detail Pages (6 routes - all use DetailPageLoading or variants)
  // ============================================================================
  /**
   * Content Detail Page
   * @route /[category]/[slug]
   * @factory custom (DetailPageLoading)
   * @reason Preset component for all content detail pages
   * @see {@link DetailPageLoading} - Preset component for detail pages
   */
  '/[category]/[slug]': {
    factory: 'custom',
    customComponent: 'DetailPageLoading',
  },
  /**
   * Job Detail Page
   * @route /jobs/[slug]
   * @factory custom (DetailPageLoading)
   * @reason Uses detail page preset (job-specific structure handled by preset)
   * @see {@link DetailPageLoading} - Preset component for detail pages
   */
  '/jobs/[slug]': {
    factory: 'custom',
    customComponent: 'JobDetailLoading',
  },
  /**
   * User Profile Page
   * @route /u/[slug]
   * @factory custom (DetailPageLoading)
   * @reason Uses detail page preset (user-specific structure handled by preset)
   * @see {@link DetailPageLoading} - Preset component for detail pages
   */
  '/u/[slug]': {
    factory: 'custom',
    customComponent: 'UserProfileLoading',
  },
  /**
   * Collection Detail Page
   * @route /account/library/[slug]
   * @factory custom (DetailPageLoading)
   * @reason Uses detail page preset (collection-specific structure handled by preset)
   * @see {@link DetailPageLoading} - Preset component for detail pages
   */
  '/account/library/[slug]': {
    factory: 'custom',
    customComponent: 'CollectionDetailLoading',
  },
  /**
   * Public Collection Page
   * @route /u/[slug]/collections/[collectionSlug]
   * @factory custom (DetailPageLoading)
   * @reason Uses detail page preset (public collection-specific structure handled by preset)
   * @see {@link DetailPageLoading} - Preset component for detail pages
   */
  '/u/[slug]/collections/[collectionSlug]': {
    factory: 'custom',
    customComponent: 'PublicCollectionLoading',
  },

  // ============================================================================
  // Auth Pages (2 routes)
  // ============================================================================
  /**
   * Login Page
   * @route /login
   * @factory createFormPageLoading
   * @config 1 card, 3 fields, actions, narrow max-width (md)
   */
  '/login': {
    factory: 'form',
    config: {
      title: 'Sign In',
      cardCount: 1,
      fieldsPerCard: [3],
      showActions: true,
      maxWidth: 'md',
    },
  },
  /**
   * OAuth Consent Page
   * @route /oauth/consent
   * @factory createFormPageLoading
   * @config 1 card, 4 fields, actions, narrow max-width (md)
   */
  '/oauth/consent': {
    factory: 'form',
    config: {
      title: 'Authorize Application',
      cardCount: 1,
      fieldsPerCard: [4],
      showActions: true,
      maxWidth: 'md',
    },
  },

  // ============================================================================
  // Root Page (1 route)
  // ============================================================================
  /**
   * Root/Home Page
   * @route /
   * @factory custom (DefaultLoading)
   * @reason Fallback spinner for homepage (complex layout handled by page Suspense boundaries)
   * @see {@link DefaultLoading} - Fallback loading component
   */
  '/': { factory: 'custom', customComponent: 'DefaultLoading' },
};
