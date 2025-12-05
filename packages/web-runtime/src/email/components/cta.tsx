import { Button, Section, Text } from '@react-email/components';
import {
  ctaSection,
  ctaTitleStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../common-styles';
import {
  type EmailCtaPreset,
  type EmailCtaPresetId,
  getCtaPreset,
} from '../config/cta-presets';
import { buildEmailCtaUrl } from '../cta';
import type { EmailUTMParams } from '../utm-templates';

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

export interface EmailCtaSectionButtonConfig extends Omit<EmailCtaButtonProps, 'utm' | 'overrides'> {
  overrides?: Partial<EmailCtaPreset>;
  // Note: 'key' is a special React prop and should NOT be included in this interface
  // It's handled separately in the map function
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
      {buttons.map((button, index) => {
        // Generate React key from button props (key is a special React prop, not part of component props)
        const reactKey = `${button.preset}-${button.variant ?? 'primary'}-${index}`;
        return (
          <EmailCtaButton
            key={reactKey}
            utm={utm}
            preset={button.preset}
            {...(button.variant !== undefined ? { variant: button.variant } : {})}
            {...(button.overrides !== undefined ? { overrides: button.overrides } : {})}
          />
        );
      })}
    </Section>
  );
}
