import React from 'npm:react@18.3.1';
import { Button, Section, Text } from 'npm:@react-email/components@0.0.22';
import { buildEmailCtaUrl } from '../cta.ts';
import type { EmailUTMParams } from '../utm-templates.ts';
import {
  ctaSection,
  ctaTitleStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../common-styles.ts';
import { getCtaPreset, type EmailCtaPresetId, type EmailCtaPreset } from '../config/cta-presets.ts';

type ButtonVariant = 'primary' | 'secondary';

export interface EmailCtaButtonProps {
  utm: EmailUTMParams;
  preset: EmailCtaPresetId;
  variant?: ButtonVariant;
  overrides?: Partial<EmailCtaPreset>;
}

export function EmailCtaButton({ utm, preset, variant = 'primary', overrides }: EmailCtaButtonProps) {
  const presetConfig = { ...getCtaPreset(preset), ...(overrides ?? {}) };
  const href = buildEmailCtaUrl(
    presetConfig.href,
    utm,
    presetConfig.contentKey ? { content: presetConfig.contentKey } : undefined
  );

  const style = variant === 'secondary' ? secondaryButtonStyle : primaryButtonStyle;

  return (
    <Button href={href} style={style}>
      {presetConfig.label}
    </Button>
  );
}

export interface EmailCtaSectionButtonConfig
  extends Omit<EmailCtaButtonProps, 'utm' | 'overrides'> {
  overrides?: Partial<EmailCtaPreset>;
}

export interface EmailCtaSectionProps {
  utm: EmailUTMParams;
  title?: string;
  description?: string;
  buttons: EmailCtaSectionButtonConfig[];
}

export function EmailCtaSection({ utm, title, description, buttons }: EmailCtaSectionProps) {
  if (buttons.length === 0) return null;

  return (
    <Section style={ctaSection}>
      {title ? <Text style={ctaTitleStyle}>{title}</Text> : null}
      {description ? <Text style={paragraphStyle}>{description}</Text> : null}
      {buttons.map((button) => (
        <EmailCtaButton
          key={`${button.preset}-${button.variant ?? 'primary'}`}
          utm={utm}
          preset={button.preset}
          variant={button.variant}
          overrides={button.overrides}
        />
      ))}
    </Section>
  );
}
