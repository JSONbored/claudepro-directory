/**
 * Client-Safe Enum Types
 *
 * Type definitions that match Prisma enums but don't import Prisma client.
 * This prevents Prisma from being bundled into client components.
 *
 * These types should match the database enum definitions exactly.
 */

// Content category enum - matches content_category in database
export type content_category =
  | 'agents'
  | 'mcp'
  | 'rules'
  | 'commands'
  | 'hooks'
  | 'statuslines'
  | 'skills'
  | 'collections'
  | 'guides'
  | 'jobs'
  | 'changelog';

export const content_category = {
  agents: 'agents' as const,
  mcp: 'mcp' as const,
  rules: 'rules' as const,
  commands: 'commands' as const,
  hooks: 'hooks' as const,
  statuslines: 'statuslines' as const,
  skills: 'skills' as const,
  collections: 'collections' as const,
  guides: 'guides' as const,
  jobs: 'jobs' as const,
  changelog: 'changelog' as const,
} as const;

// Experience level enum - matches experience_level in database
export type experience_level = 'beginner' | 'intermediate' | 'advanced';

export const experience_level = {
  beginner: 'beginner' as const,
  intermediate: 'intermediate' as const,
  advanced: 'advanced' as const,
} as const;

// Sponsorship tier enum - matches sponsorship_tier in database
export type sponsorship_tier = 'featured' | 'promoted' | 'spotlight' | 'sponsored';

export const sponsorship_tier = {
  featured: 'featured' as const,
  promoted: 'promoted' as const,
  spotlight: 'spotlight' as const,
  sponsored: 'sponsored' as const,
} as const;

// Announcement variant enum - matches announcement_variant in database
export type announcement_variant = 'default' | 'outline' | 'secondary' | 'destructive';

export const announcement_variant = {
  default: 'default' as const,
  outline: 'outline' as const,
  secondary: 'secondary' as const,
  destructive: 'destructive' as const,
} as const;

// Changelog category enum - matches changelog_category in database
export type changelog_category =
  | 'Added'
  | 'Changed'
  | 'Fixed'
  | 'Security'
  | 'Deprecated'
  | 'Removed';

export const changelog_category = {
  Added: 'Added' as const,
  Changed: 'Changed' as const,
  Fixed: 'Fixed' as const,
  Security: 'Security' as const,
  Deprecated: 'Deprecated' as const,
  Removed: 'Removed' as const,
} as const;

// Config format enum - matches config_format in database
export type config_format = 'json' | 'multi' | 'hook';

export const config_format = {
  json: 'json' as const,
  multi: 'multi' as const,
  hook: 'hook' as const,
} as const;

// Primary action type enum - matches primary_action_type in database
export type primary_action_type =
  | 'notification'
  | 'copy_command'
  | 'copy_script'
  | 'scroll'
  | 'download'
  | 'github_link';

export const primary_action_type = {
  notification: 'notification' as const,
  copy_command: 'copy_command' as const,
  copy_script: 'copy_script' as const,
  scroll: 'scroll' as const,
  download: 'download' as const,
  github_link: 'github_link' as const,
} as const;

// Job type enum - matches job_type in database
export type job_type = 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';

export const job_type = {
  full_time: 'full_time' as const,
  part_time: 'part_time' as const,
  contract: 'contract' as const,
  freelance: 'freelance' as const,
  internship: 'internship' as const,
} as const;

// Job category enum - matches job_category in database
export type job_category =
  | 'engineering'
  | 'design'
  | 'product'
  | 'marketing'
  | 'sales'
  | 'support'
  | 'research'
  | 'data'
  | 'operations'
  | 'leadership'
  | 'consulting'
  | 'education'
  | 'other';

export const job_category = {
  engineering: 'engineering' as const,
  design: 'design' as const,
  product: 'product' as const,
  marketing: 'marketing' as const,
  sales: 'sales' as const,
  support: 'support' as const,
  research: 'research' as const,
  data: 'data' as const,
  operations: 'operations' as const,
  leadership: 'leadership' as const,
  consulting: 'consulting' as const,
  education: 'education' as const,
  other: 'other' as const,
} as const;

// Job plan enum - matches job_plan in database
export type job_plan = 'one-time' | 'subscription';

export const job_plan = {
  'one-time': 'one-time' as const,
  subscription: 'subscription' as const,
} as const;

// Job tier enum - matches job_tier in database
export type job_tier = 'standard' | 'featured';

export const job_tier = {
  standard: 'standard' as const,
  featured: 'featured' as const,
} as const;

// Workplace type enum - matches workplace_type in database
export type workplace_type = 'Remote' | 'On site' | 'Hybrid';

export const workplace_type = {
  Remote: 'Remote' as const,
  On_site: 'On site' as const,
  Hybrid: 'Hybrid' as const,
} as const;

// Focus area type enum - matches focus_area_type in database
// Note: Prisma generates these with database values (hyphens), not TypeScript names (underscores)
export type focus_area_type =
  | 'security'
  | 'performance'
  | 'documentation'
  | 'testing'
  | 'code-quality'
  | 'automation';

export const focus_area_type = {
  security: 'security' as const,
  performance: 'performance' as const,
  documentation: 'documentation' as const,
  testing: 'testing' as const,
  code_quality: 'code-quality' as const,
  automation: 'automation' as const,
} as const;

// Integration type enum - matches integration_type in database
// Note: Prisma generates these with database values (hyphens), not TypeScript names (underscores)
export type integration_type =
  | 'github'
  | 'database'
  | 'cloud-aws'
  | 'cloud-gcp'
  | 'cloud-azure'
  | 'communication'
  | 'none';

export const integration_type = {
  github: 'github' as const,
  database: 'database' as const,
  cloud_aws: 'cloud-aws' as const,
  cloud_gcp: 'cloud-gcp' as const,
  cloud_azure: 'cloud-azure' as const,
  communication: 'communication' as const,
  none: 'none' as const,
} as const;

// Use case type enum - matches use_case_type in database
// Note: Prisma generates these with database values (hyphens), not TypeScript names (underscores)
export type use_case_type =
  | 'code-review'
  | 'api-development'
  | 'frontend-development'
  | 'data-science'
  | 'content-creation'
  | 'devops-infrastructure'
  | 'general-development'
  | 'testing-qa'
  | 'security-audit';

export const use_case_type = {
  code_review: 'code-review' as const,
  api_development: 'api-development' as const,
  frontend_development: 'frontend-development' as const,
  data_science: 'data-science' as const,
  content_creation: 'content-creation' as const,
  devops_infrastructure: 'devops-infrastructure' as const,
  general_development: 'general-development' as const,
  testing_qa: 'testing-qa' as const,
  security_audit: 'security-audit' as const,
} as const;

// Copy type enum - matches copy_type in database
export type copy_type = 'llmstxt' | 'markdown' | 'code' | 'link';

export const copy_type = {
  llmstxt: 'llmstxt' as const,
  markdown: 'markdown' as const,
  code: 'code' as const,
  link: 'link' as const,
} as const;

// Interaction type enum - matches interaction_type in database
export type interaction_type =
  | 'view'
  | 'copy'
  | 'bookmark'
  | 'click'
  | 'time_spent'
  | 'search'
  | 'filter'
  | 'screenshot'
  | 'share'
  | 'download'
  | 'pwa_installed'
  | 'pwa_launched'
  | 'newsletter_subscribe'
  | 'contact_interact'
  | 'contact_submit'
  | 'form_started'
  | 'form_step_completed'
  | 'form_field_focused'
  | 'form_template_selected'
  | 'form_abandoned';

export const interaction_type = {
  view: 'view' as const,
  copy: 'copy' as const,
  bookmark: 'bookmark' as const,
  click: 'click' as const,
  time_spent: 'time_spent' as const,
  search: 'search' as const,
  filter: 'filter' as const,
  screenshot: 'screenshot' as const,
  share: 'share' as const,
  download: 'download' as const,
  pwa_installed: 'pwa_installed' as const,
  pwa_launched: 'pwa_launched' as const,
  newsletter_subscribe: 'newsletter_subscribe' as const,
  contact_interact: 'contact_interact' as const,
  contact_submit: 'contact_submit' as const,
  form_started: 'form_started' as const,
  form_step_completed: 'form_step_completed' as const,
  form_field_focused: 'form_field_focused' as const,
  form_template_selected: 'form_template_selected' as const,
  form_abandoned: 'form_abandoned' as const,
} as const;

// Contact action type enum - matches contact_action_type in database
export type contact_action_type = 'internal' | 'external' | 'route' | 'sheet' | 'easter-egg';

export const contact_action_type = {
  internal: 'internal' as const,
  external: 'external' as const,
  route: 'route' as const,
  sheet: 'sheet' as const,
  'easter-egg': 'easter-egg' as const,
} as const;

// Contact command icon enum - matches contact_command_icon in database
export type contact_command_icon =
  | 'bug'
  | 'feature'
  | 'question'
  | 'feedback'
  | 'support'
  | 'general';

export const contact_command_icon = {
  bug: 'bug' as const,
  feature: 'feature' as const,
  question: 'question' as const,
  feedback: 'feedback' as const,
  support: 'support' as const,
  general: 'general' as const,
} as const;

// Contact category enum - matches contact_category in database
export type contact_category = 'general' | 'bug' | 'feature' | 'question' | 'feedback' | 'support';

export const contact_category = {
  general: 'general' as const,
  bug: 'bug' as const,
  feature: 'feature' as const,
  question: 'question' as const,
  feedback: 'feedback' as const,
  support: 'support' as const,
} as const;

// Confetti variant enum - matches confetti_variant in database
export type confetti_variant = 'success' | 'celebration' | 'milestone' | 'subtle';

export const confetti_variant = {
  success: 'success' as const,
  celebration: 'celebration' as const,
  milestone: 'milestone' as const,
  subtle: 'subtle' as const,
} as const;

// Submission status enum - matches submission_status in database
export type submission_status = 'pending' | 'approved' | 'rejected' | 'spam' | 'merged';

export const submission_status = {
  pending: 'pending' as const,
  approved: 'approved' as const,
  rejected: 'rejected' as const,
  spam: 'spam' as const,
  merged: 'merged' as const,
} as const;

// Submission type enum - matches submission_type in database
export type submission_type =
  | 'agents'
  | 'mcp'
  | 'rules'
  | 'commands'
  | 'hooks'
  | 'statuslines'
  | 'skills';

export const submission_type = {
  agents: 'agents' as const,
  mcp: 'mcp' as const,
  rules: 'rules' as const,
  commands: 'commands' as const,
  hooks: 'hooks' as const,
  statuslines: 'statuslines' as const,
  skills: 'skills' as const,
} as const;

// Form field type enum - matches form_field_type in database
export type form_field_type = 'text' | 'textarea' | 'number' | 'select';

export const form_field_type = {
  text: 'text' as const,
  textarea: 'textarea' as const,
  number: 'number' as const,
  select: 'select' as const,
} as const;

// Form grid column enum - matches form_grid_column in database
export type form_grid_column = 'full' | 'half' | 'third' | 'two_thirds';

export const form_grid_column = {
  full: 'full' as const,
  half: 'half' as const,
  third: 'third' as const,
  two_thirds: 'two_thirds' as const,
} as const;

// Form icon position enum - matches form_icon_position in database
export type form_icon_position = 'left' | 'right';

export const form_icon_position = {
  left: 'left' as const,
  right: 'right' as const,
} as const;

// Sort option enum - matches sort_option in database
export type sort_option =
  | 'relevance'
  | 'date'
  | 'popularity'
  | 'name'
  | 'updated'
  | 'created'
  | 'views'
  | 'trending';

export const sort_option = {
  relevance: 'relevance' as const,
  date: 'date' as const,
  popularity: 'popularity' as const,
  name: 'name' as const,
  updated: 'updated' as const,
  created: 'created' as const,
  views: 'views' as const,
  trending: 'trending' as const,
} as const;

// Trending period enum - matches trending_period in database
export type trending_period = 'today' | 'week' | 'month' | 'year' | 'all';

export const trending_period = {
  today: 'today' as const,
  week: 'week' as const,
  month: 'month' as const,
  year: 'year' as const,
  all: 'all' as const,
} as const;

// Job status enum - matches job_status in database
export type job_status =
  | 'draft'
  | 'pending_payment'
  | 'pending_review'
  | 'active'
  | 'expired'
  | 'rejected'
  | 'deleted';

export const job_status = {
  draft: 'draft' as const,
  pending_payment: 'pending_payment' as const,
  pending_review: 'pending_review' as const,
  active: 'active' as const,
  expired: 'expired' as const,
  rejected: 'rejected' as const,
  deleted: 'deleted' as const,
} as const;

// Changelog source enum - matches changelog_source in database
export type changelog_source = 'manual' | 'jsonbored' | 'automation';

export const changelog_source = {
  manual: 'manual' as const,
  jsonbored: 'jsonbored' as const,
  automation: 'automation' as const,
} as const;
