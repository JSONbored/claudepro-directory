/**
 * Centralized Icon Exports (SHA-2089)
 *
 * Single source of truth for all lucide-react icons used across the codebase
 * Benefits:
 * - Better tree-shaking: Bundler can optimize imports
 * - Consistent icon usage across components
 * - Easier to track and manage icon dependencies
 * - Potential 150-300KB bundle reduction
 *
 * Usage in components:
 * ```ts
 * // ✅ Correct - Import from centralized file
 * import { Copy, ExternalLink } from '@/lib/icons';
 *
 * // ❌ Avoid - Direct imports bypass optimization
 * import { Copy } from '@/lib/icons';
 * ```
 *
 * Migration Status: 72 files need migration
 * Icons Exported: 61 unique icons
 */

import {
  AlertTriangle,
  ArrowDown,
  ArrowDownIcon,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpIcon,
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
  Circle,
  Clock,
  Code,
  Command,
  Copy,
  Database,
  DollarSign,
  ExternalLink,
  FileJson,
  FileText,
  Filter,
  GitCompare,
  Github,
  Globe,
  Handshake,
  Hash,
  HelpCircle,
  Home,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  type LucideIcon,
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
  Package,
  Palette,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  Sparkles,
  Star,
  Sun,
  Tag,
  Tags,
  Target,
  Terminal,
  Thermometer,
  TrendingUp,
  Twitter,
  User,
  Users,
  Webhook,
  Workflow,
  X,
  Zap,
} from 'lucide-react';

// Map of icon names to components for dynamic loading
export const iconMap: Record<string, LucideIcon> = {
  'alert-triangle': AlertTriangle,
  'arrow-down': ArrowDown,
  'arrow-down-icon': ArrowDownIcon,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-up-icon': ArrowUpIcon,
  'book-open': BookOpen,
  bot: Bot,
  briefcase: Briefcase,
  building: Building,
  'building-2': Building2,
  building2: Building2,
  calendar: Calendar,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  circle: Circle,
  clock: Clock,
  code: Code,
  command: Command,
  copy: Copy,
  database: Database,
  'dollar-sign': DollarSign,
  'external-link': ExternalLink,
  'file-json': FileJson,
  'file-text': FileText,
  filter: Filter,
  'git-compare': GitCompare,
  github: Github,
  globe: Globe,
  handshake: Handshake,
  hash: Hash,
  'help-circle': HelpCircle,
  home: Home,
  info: Info,
  layers: Layers,
  lightbulb: Lightbulb,
  loader2: Loader2,
  mail: Mail,
  'map-pin': MapPin,
  maximize2: Maximize2,
  megaphone: Megaphone,
  menu: Menu,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  minimize2: Minimize2,
  'minus-icon': MinusIcon,
  monitor: Monitor,
  moon: Moon,
  package: Package,
  palette: Palette,
  plus: Plus,
  'refresh-cw': RefreshCw,
  rocket: Rocket,
  search: Search,
  send: Send,
  server: Server,
  settings: Settings,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  tag: Tag,
  tags: Tags,
  target: Target,
  terminal: Terminal,
  thermometer: Thermometer,
  'trending-up': TrendingUp,
  twitter: Twitter,
  user: User,
  users: Users,
  webhook: Webhook,
  workflow: Workflow,
  x: X,
  zap: Zap,
};

// Helper function to get icon component by name with fallback
export function getIconByName(iconName: string): LucideIcon {
  const normalizedName = iconName
    .toLowerCase()
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-/, '');
  return iconMap[normalizedName] || iconMap[iconName] || HelpCircle;
}

// Export all icons for direct imports (organized by usage frequency)
// High-frequency icons (5+ uses)
export {
  AlertTriangle, // 6 uses
  BookOpen, // 7 uses
  Check, // 6 uses
  CheckCircle, // 8 uses
  Clock, // 5 uses
  Copy, // 10 uses - most used
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
  Star,
  TrendingUp,
  Users,
  X,
};

// Low-frequency icons (1-2 uses) - exported for completeness
export {
  ArrowDown,
  ArrowDownIcon,
  ArrowRight,
  ArrowUp,
  ArrowUpIcon,
  Bot,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Circle,
  Code,
  Command,
  Database,
  DollarSign,
  FileJson,
  FileText,
  Filter,
  GitCompare,
  Globe,
  Handshake,
  Hash,
  HelpCircle,
  Home,
  Layers,
  Lightbulb,
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
  Package,
  Palette,
  Plus,
  RefreshCw,
  Rocket,
  Send,
  Server,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Tag,
  Tags,
  Target,
  Terminal,
  Thermometer,
  Twitter,
  User,
  Webhook,
  Workflow,
};

// Export LucideIcon type for component props
export type { LucideIcon };
