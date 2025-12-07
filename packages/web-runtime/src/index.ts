/**
 * @heyclaude/web-runtime - Next.js Web Application Runtime
 *
 * This package provides client-safe utilities, components, and hooks for the
 * Next.js web application. It is designed to be imported by both client and
 * server components.
 *
 * ## Package Boundaries
 *
 * ### @heyclaude/shared-runtime
 * - Pure TypeScript utilities (no React, no Next.js)
 * - Environment-agnostic (works in Node, Deno, browser)
 * - Examples: config, logging, error handling, schemas
 *
 * ### @heyclaude/web-runtime (this package)
 * - React/Next.js specific utilities
 * - Client-safe by default (main export)
 * - Hooks, components, UI primitives
 *
 * ### @heyclaude/web-runtime/server
 * - Server-only utilities (marked with 'server-only')
 * - Supabase server clients, admin operations
 * - Data loaders, cache configuration
 * - NEVER import from client components
 *
 * ### @heyclaude/web-runtime/actions
 * - Server actions (marked with 'use server')
 * - Safe to import from client (Next.js handles serialization)
 *
 * ### @heyclaude/web-runtime/hooks
 * - Client-side React hooks
 * - State management, effects, callbacks
 *
 * ### @heyclaude/web-runtime/ui
 * - UI components (client-safe)
 * - Buttons, cards, forms, skeletons, etc.
 *
 * ### @heyclaude/data-layer
 * - Database types and RPC utilities
 * - Supabase-specific data operations
 *
 * ## When to Add to Which Package
 *
 * - **Pure utility function?** → shared-runtime
 * - **React hook?** → web-runtime/hooks
 * - **React component?** → web-runtime/ui
 * - **Server-only data fetching?** → web-runtime/server
 * - **Server action?** → web-runtime/actions
 * - **Database types/schemas?** → data-layer
 *
 * @packageDocumentation
 */

export * from './config/social-links.ts';
// Re-export from shared-runtime for backward compatibility during refactor
export { APP_CONFIG, type AppConfig } from '@heyclaude/shared-runtime';
export { SECURITY_CONFIG, type SecurityConfig } from '@heyclaude/shared-runtime';
export { ROUTES } from '@heyclaude/shared-runtime';
export { EXTERNAL_SERVICES } from '@heyclaude/shared-runtime';
export { TIME_CONSTANTS } from '@heyclaude/shared-runtime';

export * from './logger.ts';
export * from './errors.ts';
export * from './build-time.ts';
export * from './data.ts';
export * from './pulse.ts';
export * from './skeleton-keys.ts';
export * from './error-utils.ts';
export * from './content.ts';
export * from './notifications.ts';
export * from './ui.ts';
export * from './trace.ts';
// Supabase server exports moved to @heyclaude/web-runtime/server to prevent client bundle inclusion
// export * from './supabase/index.ts';
export * from './auth/mfa.ts';
export * from './auth/aal.ts';
export * from './auth/oauth-providers.ts';
export * from './storage/image-utils.ts';
export * from './edge/call-edge-function.ts';
export * from './edge/transform.ts';
export * from './edge/search-client.ts';
export * from './utils/markdown-code-extractor.ts';
export * from './seo/og.ts';
export * from './pulse-client.ts';
// Export all icons except Command (which conflicts with Command component from ui.ts)
export {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  ExternalLink,
  Github,
  Search,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  AlertCircle,
  ArrowDown,
  ArrowDownIcon,
  ArrowRight,
  ArrowUp,
  ArrowUpIcon,
  ArrowUpRight,
  Award,
  Medal,
  Trophy,
  BarChart,
  Bell,
  Bookmark,
  BookmarkCheck,
  BookmarkMinus,
  BookmarkPlus,
  Bot,
  Brain,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Camera,
  Chrome,
  Circle,
  Code,
  Command as CommandIcon, // Renamed to avoid conflict with Command component
  Database,
  DollarSign,
  Download,
  Edit,
  Facebook,
  FileCode,
  FileJson,
  FileText,
  Filter,
  FolderOpen,
  GitCompare,
  GitPullRequest,
  Globe,
  Handshake,
  Hash,
  Heart,
  HelpCircle,
  Home,
  Layers,
  Lightbulb,
  Linkedin,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Minimize2,
  MinusIcon,
  Monitor,
  Moon,
  MousePointer,
  Package,
  Palette,
  Pause,
  Play,
  Plug,
  Plus,
  PlusCircle,
  RefreshCw,
  Rocket,
  Rss,
  Save,
  Send,
  Server,
  Settings,
  Share2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tag,
  Tags,
  Target,
  Terminal,
  Thermometer,
  Trash,
  Twitter,
  User,
  Webhook,
  Workflow,
  XCircle,
  ThumbsUp,
  Activity,
  ListTree,
  X,
} from './icons.tsx';
export type { LucideIcon } from './icons.tsx';
export * from './types/component.types.ts';
export * from './transformers/skill-to-md.ts';
export * from './hooks/index.ts';
export * from './integrations/polar.ts';
export * from './utils/auth-redirect.ts';
export * from './utils/category-validation.ts';
export * from './utils/content-highlights.ts';

// Actions (Isomorphic exports)
export * from './entries/actions.ts';
