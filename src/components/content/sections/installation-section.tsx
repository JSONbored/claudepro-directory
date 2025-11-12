'use client';

/**
 * Installation Section - Displays platform-specific setup instructions
 * Handles Claude Code, Claude Desktop, and SDK installation flows
 */

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
import { Copy } from '@/src/lib/icons';
import type { ContentItem } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

const SCROLL_REVEAL_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

interface InstallationSectionProps {
  installationData: {
    claudeCode: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
      configFormat?: string;
    } | null;
    claudeDesktop: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
    } | null;
    sdk: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
    } | null;
    requirements?: string[];
  };
  item: ContentItem;
  className?: string;
}

export default function InstallationSection({
  installationData,
  item,
  className,
}: InstallationSectionProps) {
  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className={UI_CLASSES.ICON_MD} />
            Installation
          </CardTitle>
          <CardDescription>Setup instructions and requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {installationData.claudeCode && (
            <div className="space-y-4">
              <h4 className="font-medium">Claude Code Setup</h4>
              <div className="space-y-3">
                {installationData.claudeCode.steps.map((step, index) => {
                  const stepKey = `cc-step-${index}-${step.type}`;
                  if (step.type === 'command') {
                    return (
                      <div key={stepKey} className="space-y-2">
                        <div className="text-muted-foreground text-sm">
                          Step {index + 1}: Run command
                        </div>
                        <ProductionCodeBlock
                          html={step.html}
                          code={step.code}
                          language="bash"
                          filename={`install-step-${index + 1}.sh`}
                          maxLines={10}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={stepKey} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span className="text-sm leading-relaxed">{step.text}</span>
                    </div>
                  );
                })}
              </div>
              {installationData.claudeCode.configPath && (
                <div>
                  <h5 className="mb-2 font-medium text-sm">Configuration Paths</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(installationData.claudeCode.configPath).map(
                      ([location, path]) => (
                        <div key={location} className={UI_CLASSES.FLEX_GAP_2}>
                          <UnifiedBadge variant="base" style="outline" className="capitalize">
                            {location}
                          </UnifiedBadge>
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            {String(path)}
                          </code>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {installationData.claudeDesktop && (
            <div className="space-y-4">
              <h4 className="font-medium">Claude Desktop Setup</h4>
              <div className="space-y-3">
                {installationData.claudeDesktop.steps.map((step, index) => {
                  const stepKey = `cd-step-${index}-${step.type}`;
                  if (step.type === 'command') {
                    return (
                      <div key={stepKey} className="space-y-2">
                        <div className="text-muted-foreground text-sm">
                          Step {index + 1}: Run command
                        </div>
                        <ProductionCodeBlock
                          html={step.html}
                          code={step.code}
                          language="bash"
                          filename={`desktop-step-${index + 1}.sh`}
                          maxLines={10}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={stepKey} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span className="text-sm leading-relaxed">{step.text}</span>
                    </div>
                  );
                })}
              </div>
              {installationData.claudeDesktop.configPath && (
                <div>
                  <h5 className="mb-2 font-medium text-sm">Configuration Paths</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(installationData.claudeDesktop.configPath).map(
                      ([platform, path]) => (
                        <div key={platform} className={UI_CLASSES.FLEX_GAP_2}>
                          <UnifiedBadge variant="base" style="outline" className="capitalize">
                            {platform}
                          </UnifiedBadge>
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            {String(path)}
                          </code>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {installationData.sdk && (
            <div className="space-y-4">
              <h4 className="font-medium">SDK Setup</h4>
              <div className="space-y-3">
                {installationData.sdk.steps.map((step, index) => {
                  const stepKey = `sdk-step-${index}-${step.type}`;
                  if (step.type === 'command') {
                    return (
                      <div key={stepKey} className="space-y-2">
                        <div className="text-muted-foreground text-sm">
                          Step {index + 1}: Run command
                        </div>
                        <ProductionCodeBlock
                          html={step.html}
                          code={step.code}
                          language="bash"
                          filename={`sdk-step-${index + 1}.sh`}
                          maxLines={10}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={stepKey} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span className="text-sm leading-relaxed">{step.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {installationData.requirements && installationData.requirements.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium">Requirements</h4>
              <ul className="space-y-2">
                {installationData.requirements.map((requirement: string) => (
                  <li key={requirement.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-500" />
                    <span className="text-sm leading-relaxed">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
