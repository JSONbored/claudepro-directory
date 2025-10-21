/**
 * Centralized Icon Exports
 *
 * Single source of truth for all lucide-react icons used across the codebase
 *
 * Benefits:
 * - **Consistency**: Single import source across entire codebase
 * - **Maintainability**: Change icon library once, not in 100+ files
 * - **Discoverability**: Easy to see which icons are actively used
 * - **Refactoring**: Swap icon implementations without touching consumers
 *
 * Tree-Shaking:
 * - ✅ Modern bundlers (Webpack 5, esbuild, Rollup) tree-shake this equally well as direct imports
 * - ✅ This is a re-export barrel (not a namespace import), so dead code elimination works
 * - ⚠️ No bundle size improvement over direct imports - organizational benefit only
 *
 * Usage in components:
 * ```ts
 * // ✅ Recommended - Centralized import
 * import { Copy, ExternalLink } from '@/src/lib/icons';
 *
 * // ✅ Also fine - Direct import (same bundle output)
 * import { Copy } from 'lucide-react';
 * ```
 *
 * Icons Exported: 61 unique icons
 */

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowDownIcon,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpIcon,
  ArrowUpRight,
  Award,
  BarChart,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Bot,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Chrome,
  Circle,
  Clock,
  Code,
  Command,
  Copy,
  Database,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  Facebook,
  FileJson,
  FileText,
  Filter,
  FolderOpen,
  GitCompare,
  Github,
  GitPullRequest,
  Globe,
  Handshake,
  Hash,
  HelpCircle,
  Home,
  Info,
  Layers,
  Lightbulb,
  Linkedin,
  Loader2,
  Lock,
  LogOut,
  type LucideIcon,
  Mail,
  MapPin,
  Maximize2,
  Medal,
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
  Search,
  Send,
  Server,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Star,
  Sun,
  Tag,
  Tags,
  Target,
  Terminal,
  Thermometer,
  ThumbsUp,
  Trash,
  TrendingUp,
  Trophy,
  Twitter,
  User,
  Users,
  Webhook,
  Workflow,
  X,
  XCircle,
  Zap,
} from 'lucide-react';

// Export all icons for direct imports (organized by usage frequency)
// High-frequency icons (5+ uses)
export {
  AlertTriangle, // 6 uses
  BookOpen, // 7 uses
  Check, // 6 uses
  CheckCircle, // 8 uses
  Clock, // 5 uses
  Copy, // 10 uses - most used
  Eye, // View counts
  ExternalLink, // 9 uses
  Github, // 5 uses
  Search, // 5 uses
  Zap, // 5 uses
};

// Medium-frequency icons (3-4 uses)
export {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Info,
  Loader2,
  Lock,
  Star,
  TrendingUp,
  Users,
  X,
};

// Low-frequency icons (1-2 uses) - exported for completeness
export {
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
  Bookmark,
  BookmarkCheck,
  Bot,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Chrome,
  Circle,
  Code,
  Command,
  Database,
  DollarSign,
  Download,
  Edit,
  Facebook,
  FileJson,
  FileText,
  Filter,
  FolderOpen,
  GitCompare,
  GitPullRequest,
  Globe,
  Handshake,
  Hash,
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
  Send,
  Server,
  Settings,
  Share2,
  Shield,
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
};

// Export LucideIcon type for component props
export type { LucideIcon };

/**
 * Custom SVG Icons (SHA-2093)
 * Extracted from navigation.tsx to centralize icon management
 */

export const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    role="img"
    aria-label="Discord"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

export const LogoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    role="img"
    aria-label="Claude Pro Directory Logo"
  >
    {/* Background circle in theme background */}
    <circle
      cx="12"
      cy="12"
      r="11"
      fill="hsl(var(--background))"
      stroke="hsl(var(--accent))"
      strokeWidth="2"
    />
    {/* 8-pointed star/asterisk rays in Claude orange */}
    <path
      d="M12 2 L12 8 M12 16 L12 22 M4 12 L8 12 M16 12 L20 12 M6.5 6.5 L9 9 M15 15 L17.5 17.5 M17.5 6.5 L15 9 M9 15 L6.5 17.5"
      stroke="hsl(var(--accent))"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Center dot in Claude orange */}
    <circle cx="12" cy="12" r="1" fill="hsl(var(--accent))" />
  </svg>
);
