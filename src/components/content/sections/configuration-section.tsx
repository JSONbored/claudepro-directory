'use client';

/**
 * Configuration Section - Displays configuration settings with 3 format variants
 * Handles simple JSON configs, multi-format configs (MCP), and hook configs
 */

import { motion } from 'motion/react';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { Copy } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

const SCROLL_REVEAL_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

type ConfigurationSectionProps =
  | {
      format: 'json';
      html: string;
      code: string;
      filename: string;
      className?: string;
    }
  | {
      format: 'multi';
      configs: Array<{
        key: string;
        html: string;
        code: string;
        filename: string;
      }>;
      className?: string;
    }
  | {
      format: 'hook';
      hookConfig: {
        html: string;
        code: string;
        filename: string;
      } | null;
      scriptContent: {
        html: string;
        code: string;
        filename: string;
      } | null;
      className?: string;
    };

export default function ConfigurationSection(props: ConfigurationSectionProps) {
  if (props.format === 'multi') {
    const { configs, className } = props;

    return (
      <motion.div {...SCROLL_REVEAL_ANIMATION}>
        <Card data-section="configuration" className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_MD} />
              Configuration
            </CardTitle>
            <CardDescription>
              Add these configurations to your Claude Desktop or Claude Code setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {configs.map((config) => (
              <div key={config.key}>
                <ProductionCodeBlock
                  html={config.html}
                  code={config.code}
                  language="json"
                  filename={config.filename}
                  maxLines={25}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (props.format === 'hook') {
    const { hookConfig, scriptContent, className } = props;

    return (
      <motion.div {...SCROLL_REVEAL_ANIMATION}>
        <Card className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_MD} />
              Hook Configuration
            </CardTitle>
            <CardDescription>Hook setup and script content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hookConfig && (
              <ProductionCodeBlock
                html={hookConfig.html}
                code={hookConfig.code}
                language="json"
                filename={hookConfig.filename}
                maxLines={20}
              />
            )}
            {scriptContent && (
              <ProductionCodeBlock
                html={scriptContent.html}
                code={scriptContent.code}
                language="bash"
                filename={scriptContent.filename}
                maxLines={25}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const { html, code, filename, className } = props;

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className={UI_CLASSES.ICON_MD} />
            Configuration
          </CardTitle>
          <CardDescription>Configuration settings and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductionCodeBlock
            html={html}
            code={code}
            language="json"
            filename={filename}
            maxLines={25}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
