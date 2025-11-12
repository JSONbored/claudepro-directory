'use client';

import { motion } from 'motion/react';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import type { CategoryId } from '@/src/lib/config/category-config.types';
import { Bookmark, BookOpen, Bot, Briefcase, Code, Copy, FileText, type LucideIcon, Package, Rocket, Sparkles, Terminal, Zap } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import type { UnifiedSectionProps } from './unified-section.types';

const ICONS: Record<CategoryId, LucideIcon> = { agents: Sparkles, mcp: Package, commands: Terminal, rules: FileText, hooks: Code, statuslines: Zap, collections: Bookmark, skills: Rocket, guides: BookOpen, jobs: Briefcase, changelog: Bot };

function Wrapper({ title, description, icon = Copy, category, className, children }: { title: string; description?: string; icon?: LucideIcon; category?: CategoryId; className?: string; children: React.ReactNode }) {
  const Icon = category ? ICONS[category] : icon;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}><Icon className={UI_CLASSES.ICON_MD} />{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function List({ items, color }: { items: string[]; color: string }) {
  return <ul className="space-y-2">{items.map((item) => <li key={item.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}><div className={cn('mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full', color)} /><span className="text-sm leading-relaxed">{item}</span></li>)}</ul>;
}

function EnhancedList({ items, color }: { items: Array<string | { issue: string; solution: string }>; color: string }) {
  return <ul className="space-y-4">{items.map((item, i) => typeof item === 'string' ? <li key={i} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}><div className={cn('mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full', color)} /><span className="text-sm leading-relaxed">{item}</span></li> : <li key={i} className="space-y-2"><div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}><div className={cn('mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full', color)} /><div className="space-y-1"><p className="font-medium text-foreground text-sm">{item.issue}</p><p className="text-muted-foreground text-sm leading-relaxed">{item.solution}</p></div></div></li>)}</ul>;
}

function Platform({ name, steps, paths }: { name: string; steps: Array<{ type: 'command'; html: string; code: string } | { type: 'text'; text: string }>; paths?: Record<string, string> }) {
  return <div className="space-y-4"><h4 className="font-medium">{name}</h4><div className="space-y-3">{steps.map((s, i) => s.type === 'command' ? <div key={i} className="space-y-2"><div className="text-muted-foreground text-sm">Step {i + 1}: Run command</div><ProductionCodeBlock html={s.html} code={s.code} language="bash" filename={`${name.toLowerCase()}-${i + 1}.sh`} maxLines={10} /></div> : <div key={i} className="flex items-start gap-3"><div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" /><span className="text-sm leading-relaxed">{s.text}</span></div>)}</div>{paths && <div><h5 className="mb-2 font-medium text-sm">Configuration Paths</h5><div className="space-y-1 text-sm">{Object.entries(paths).map(([k, p]) => <div key={k} className={UI_CLASSES.FLEX_GAP_2}><UnifiedBadge variant="base" style="outline" className="capitalize">{k}</UnifiedBadge><code className="rounded bg-muted px-1 py-0.5 text-xs">{String(p)}</code></div>)}</div></div>}</div>;
}

export default function UnifiedSection(props: UnifiedSectionProps) {
  switch (props.variant) {
    case 'list': {
      if (props.items.length === 0) return null;
      return <Wrapper title={props.title} description={props.description} icon={props.icon} category={props.category} className={props.className}><List items={props.items} color={props.dotColor || 'bg-primary'} /></Wrapper>;
    }
    case 'enhanced-list': {
      if (props.items.length === 0) return null;
      return <Wrapper title={props.title} description={props.description} icon={props.icon} className={props.className}><EnhancedList items={props.items} color={props.dotColor || 'bg-red-500'} /></Wrapper>;
    }
    case 'code':
      return <Wrapper title={props.title} description={props.description} icon={props.icon} className={props.className}><ProductionCodeBlock html={props.html} code={props.code} language={props.language} filename={props.filename} maxLines={20} /></Wrapper>;
    case 'examples': {
      if (props.examples.length === 0) return null;
      return <Wrapper title={props.title || 'Usage Examples'} description={props.description || 'Practical code examples demonstrating common use cases and implementation patterns'} icon={props.icon} className={props.className}><div className="space-y-6">{props.examples.map((ex, i) => <article key={`${ex.title}-${i}`} className="space-y-3" itemScope itemType="https://schema.org/SoftwareSourceCode"><div className="space-y-1"><h4 className="font-semibold text-base text-foreground" itemProp="name">{ex.title}</h4>{ex.description && <p className="text-muted-foreground text-sm leading-relaxed" itemProp="description">{ex.description}</p>}</div><div className="not-prose" itemProp="text"><meta itemProp="programmingLanguage" content={ex.language} /><ProductionCodeBlock html={ex.html} code={ex.code} language={ex.language} filename={ex.filename} maxLines={props.maxLines || 20} showLineNumbers={props.showLineNumbers || false} className="shadow-sm" /></div></article>)}</div></Wrapper>;
    }
    case 'configuration': {
      if (props.format === 'multi') return <Wrapper title="Configuration" description="Add these configurations to your Claude Desktop or Claude Code setup" className={props.className}><div className="space-y-6">{props.configs.map((c) => <ProductionCodeBlock key={c.key} html={c.html} code={c.code} language="json" filename={c.filename} maxLines={25} />)}</div></Wrapper>;
      if (props.format === 'hook') return <Wrapper title="Hook Configuration" description="Hook setup and script content" className={props.className}><div className="space-y-4">{props.hookConfig && <ProductionCodeBlock html={props.hookConfig.html} code={props.hookConfig.code} language="json" filename={props.hookConfig.filename} maxLines={20} />}{props.scriptContent && <ProductionCodeBlock html={props.scriptContent.html} code={props.scriptContent.code} language="bash" filename={props.scriptContent.filename} maxLines={25} />}</div></Wrapper>;
      return <Wrapper title="Configuration" description="Configuration settings and parameters" className={props.className}><ProductionCodeBlock html={props.html} code={props.code} language="json" filename={props.filename} maxLines={25} /></Wrapper>;
    }
    case 'installation': {
      const d = props.installationData;
      return <Wrapper title="Installation" description="Setup instructions and requirements" className={props.className}><div className="space-y-6">{d.claudeCode && <Platform name="Claude Code Setup" steps={d.claudeCode.steps} paths={d.claudeCode.configPath} />}{d.claudeDesktop && <Platform name="Claude Desktop Setup" steps={d.claudeDesktop.steps} paths={d.claudeDesktop.configPath} />}{d.sdk && <Platform name="SDK Setup" steps={d.sdk.steps} />}{d.requirements && d.requirements.length > 0 && <div><h4 className="mb-2 font-medium">Requirements</h4><List items={d.requirements} color="bg-orange-500" /></div>}</div></Wrapper>;
    }
    default:
      return null;
  }
}
