'use client';

import type { Database } from '@heyclaude/database-types';
import { cn, UI_CLASSES } from '@heyclaude/web-runtime';
import {
  Bookmark,
  BookOpen,
  Bot,
  Briefcase,
  Code,
  Copy,
  FileText,
  type LucideIcon,
  Package,
  Rocket,
  Sparkles,
  Terminal,
  Zap,
} from '@heyclaude/web-runtime/icons';
import { motion } from 'motion/react';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import type { UnifiedSectionProps } from '@/src/lib/types/component.types';

const ICONS: Record<Database['public']['Enums']['content_category'], LucideIcon> = {
  agents: Sparkles,
  mcp: Package,
  commands: Terminal,
  rules: FileText,
  hooks: Code,
  statuslines: Zap,
  collections: Bookmark,
  skills: Rocket,
  guides: BookOpen,
  jobs: Briefcase,
  changelog: Bot,
};

function Wrapper({
  title,
  description,
  icon = Copy,
  category,
  className,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  category?: Database['public']['Enums']['content_category'];
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = category ? ICONS[category] : icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className={UI_CLASSES.ICON_MD} />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function List({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
          <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
          <span className="text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

type EnhancedListItem = string | { issue: string; solution: string };

const getEnhancedListKey = (item: EnhancedListItem, index: number) =>
  typeof item === 'string'
    ? `enhanced-string-${item.slice(0, 50)}-${index}`
    : `enhanced-object-${item.issue}-${item.solution.slice(0, 50)}-${index}`;

function EnhancedList({ items, color }: { items: EnhancedListItem[]; color: string }) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) =>
        typeof item === 'string' ? (
          <li key={getEnhancedListKey(item, index)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
            <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ) : (
          <li key={getEnhancedListKey(item, index)} className="space-y-2">
            <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
              <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm">{item.issue}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.solution}</p>
              </div>
            </div>
          </li>
        )
      )}
    </ul>
  );
}

type PlatformStep =
  | { type: 'command'; html: string; code: string }
  | { type: 'text'; text: string };

function Platform({
  name,
  steps,
  paths,
}: {
  name: string;
  steps: PlatformStep[];
  paths?: Record<string, string>;
}) {
  const getStepKey = (step: PlatformStep, index: number) =>
    step.type === 'command'
      ? `platform-${name.toLowerCase()}-command-${step.code}-${index}`
      : `platform-${name.toLowerCase()}-text-${step.text}-${index}`;

  return (
    <div className="space-y-4">
      <h4 className="font-medium">{name}</h4>
      <div className="space-y-3">
        {steps.map((step, index) =>
          step.type === 'command' ? (
            <div key={getStepKey(step, index)} className="space-y-2">
              <div className="text-muted-foreground text-sm">Step {index + 1}: Run command</div>
              <ProductionCodeBlock
                html={step.html}
                code={step.code}
                language="bash"
                filename={`${name.toLowerCase()}-${index + 1}.sh`}
                maxLines={10}
              />
            </div>
          ) : (
            <div key={getStepKey(step, index)} className="flex items-start gap-3">
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-sm leading-relaxed">{step.text}</span>
            </div>
          )
        )}
      </div>
      {paths && (
        <div>
          <h5 className="mb-2 font-medium text-sm">Configuration Paths</h5>
          <div className="space-y-1 text-sm">
            {Object.entries(paths).map(([k, p]) => (
              <div key={k} className={UI_CLASSES.FLEX_GAP_2}>
                <UnifiedBadge variant="base" style="outline" className="capitalize">
                  {k}
                </UnifiedBadge>
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{String(p)}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedSection(props: UnifiedSectionProps) {
  switch (props.variant) {
    case 'list': {
      if (props.items.length === 0) return null;

      return (
        <Wrapper
          title={props.title}
          description={props.description}
          {...(props.icon && { icon: props.icon })}
          {...(props.category && { category: props.category })}
          {...(props.className && { className: props.className })}
        >
          <List items={props.items} color={props.dotColor || 'bg-primary'} />
        </Wrapper>
      );
    }

    case 'enhanced-list': {
      if (props.items.length === 0) return null;

      return (
        <Wrapper
          title={props.title}
          {...(props.description && { description: props.description })}
          {...(props.icon && { icon: props.icon })}
          {...(props.className && { className: props.className })}
        >
          <EnhancedList items={props.items} color={props.dotColor || 'bg-red-500'} />
        </Wrapper>
      );
    }

    case 'code':
      return (
        <Wrapper
          title={props.title}
          {...(props.description && { description: props.description })}
          {...(props.icon && { icon: props.icon })}
          {...(props.className && { className: props.className })}
        >
          <ProductionCodeBlock
            html={props.html}
            code={props.code}
            language={props.language}
            filename={props.filename}
            maxLines={20}
          />
        </Wrapper>
      );

    case 'examples': {
      if (props.examples.length === 0) return null;

      return (
        <Wrapper
          title={props.title || 'Usage Examples'}
          description={
            props.description ||
            'Practical code examples demonstrating common use cases and implementation patterns'
          }
          {...(props.icon && { icon: props.icon })}
          {...(props.className && { className: props.className })}
        >
          <div className="space-y-6">
            {props.examples.map((ex, i) => (
              <article
                key={`${ex.title}-${i}`}
                className="space-y-3"
                itemScope={true}
                itemType="https://schema.org/SoftwareSourceCode"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-base text-foreground" itemProp="name">
                    {ex.title}
                  </h4>
                  {ex.description && (
                    <p
                      className="text-muted-foreground text-sm leading-relaxed"
                      itemProp="description"
                    >
                      {ex.description}
                    </p>
                  )}
                </div>
                <div className="not-prose" itemProp="text">
                  <meta itemProp="programmingLanguage" content={ex.language} />
                  <ProductionCodeBlock
                    html={ex.html}
                    code={ex.code}
                    language={ex.language}
                    filename={ex.filename}
                    maxLines={props.maxLines || 20}
                    showLineNumbers={props.showLineNumbers}
                    className="shadow-sm"
                  />
                </div>
              </article>
            ))}
          </div>
        </Wrapper>
      );
    }

    case 'configuration': {
      if (props.format === 'multi') {
        return (
          <Wrapper
            title="Configuration"
            description="Add these configurations to your Claude Desktop or Claude Code setup"
            {...(props.className && { className: props.className })}
          >
            <div className="space-y-6">
              {props.configs.map((c) => (
                <ProductionCodeBlock
                  key={c.key}
                  html={c.html}
                  code={c.code}
                  language="json"
                  filename={c.filename}
                  maxLines={25}
                />
              ))}
            </div>
          </Wrapper>
        );
      }

      if (props.format === 'hook') {
        return (
          <Wrapper
            title="Hook Configuration"
            description="Hook setup and script content"
            {...(props.className && { className: props.className })}
          >
            <div className="space-y-4">
              {props.hookConfig && (
                <ProductionCodeBlock
                  html={props.hookConfig.html}
                  code={props.hookConfig.code}
                  language="json"
                  filename={props.hookConfig.filename}
                  maxLines={20}
                />
              )}
              {props.scriptContent && (
                <ProductionCodeBlock
                  html={props.scriptContent.html}
                  code={props.scriptContent.code}
                  language="bash"
                  filename={props.scriptContent.filename}
                  maxLines={25}
                />
              )}
            </div>
          </Wrapper>
        );
      }

      return (
        <Wrapper
          title="Configuration"
          description="Configuration settings and parameters"
          {...(props.className && { className: props.className })}
        >
          <ProductionCodeBlock
            html={props.html}
            code={props.code}
            language="json"
            filename={props.filename}
            maxLines={25}
          />
        </Wrapper>
      );
    }

    case 'installation': {
      const d = props.installationData;

      return (
        <Wrapper
          title="Installation"
          description="Setup instructions and requirements"
          {...(props.className && { className: props.className })}
        >
          <div className="space-y-6">
            {d.claudeCode && (
              <Platform
                name="Claude Code Setup"
                steps={d.claudeCode.steps}
                {...(d.claudeCode.configPath && { paths: d.claudeCode.configPath })}
              />
            )}
            {d.claudeDesktop && (
              <Platform
                name="Claude Desktop Setup"
                steps={d.claudeDesktop.steps}
                {...(d.claudeDesktop.configPath && { paths: d.claudeDesktop.configPath })}
              />
            )}
            {d.sdk && <Platform name="SDK Setup" steps={d.sdk.steps} />}
            {d.mcpb && <Platform name="One-Click Install (.mcpb)" steps={d.mcpb.steps} />}
            {d.requirements && d.requirements.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium">Requirements</h4>
                <List items={d.requirements} color="bg-orange-500" />
              </div>
            )}
          </div>
        </Wrapper>
      );
    }

    default:
      return null;
  }
}
