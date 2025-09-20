// Optimized icon imports - only import what we need
import {
  BookOpen,
  Bot,
  Code,
  Command,
  Database,
  FileText,
  Globe,
  HelpCircle,
  Lightbulb,
  type LucideIcon,
  Monitor,
  Package,
  Palette,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';

// Map of icon names to components for dynamic loading
export const iconMap: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  bot: Bot,
  code: Code,
  command: Command,
  database: Database,
  'file-text': FileText,
  globe: Globe,
  'help-circle': HelpCircle,
  lightbulb: Lightbulb,
  monitor: Monitor,
  package: Package,
  palette: Palette,
  search: Search,
  server: Server,
  settings: Settings,
  shield: Shield,
  sparkles: Sparkles,
  terminal: Terminal,
  workflow: Workflow,
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

// Export commonly used icons for direct imports
export {
  BookOpen,
  Bot,
  Code,
  Command,
  Database,
  FileText,
  Globe,
  HelpCircle,
  Lightbulb,
  Monitor,
  Package,
  Palette,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
};
