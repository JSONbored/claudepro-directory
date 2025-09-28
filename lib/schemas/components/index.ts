/**
 * Component Schema Index
 * Exports all component-related schemas
 */

// Content item schemas
export {
  type ContentCategory,
  type UnifiedContentItem,
  unifiedContentItemSchema,
} from './content-item.schema';

// Page props schemas
export {
  type AgentDetailPageProps,
  agentDetailPagePropsSchema,
  type CommandDetailPageProps,
  type ContentDetailPageProps,
  type ContentListPageProps,
  commandDetailPagePropsSchema,
  contentDetailPagePropsSchema,
  contentListPagePropsSchema,
  type HomePageClientProps,
  type HomePageProps,
  type HookDetailPageProps,
  homePageClientPropsSchema,
  homePagePropsSchema,
  hookDetailPagePropsSchema,
  type McpDetailPageProps,
  mcpDetailPagePropsSchema,
  type PageProps,
  pagePropsSchema,
  type RuleDetailPageProps,
  ruleDetailPagePropsSchema,
  type SearchParams,
  type SlugParams,
  searchParamsSchema,
  slugParamsSchema,
} from './page-props.schema';

// UI component props schemas
export {
  type BadgeProps,
  type ButtonProps,
  badgePropsSchema,
  buttonPropsSchema,
  type CardProps,
  type CarouselProps,
  type ConfigCardProps,
  cardPropsSchema,
  carouselPropsSchema,
  configCardPropsSchema,
  type DropdownMenuProps,
  dropdownMenuPropsSchema,
  type FilterProps,
  filterPropsSchema,
  type InputProps,
  inputPropsSchema,
  reactNodeSchema,
  type SearchProps,
  searchPropsSchema,
  type TabsProps,
  type TextareaProps,
  tabsPropsSchema,
  textareaPropsSchema,
} from './ui-props.schema';
