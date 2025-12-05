import type React from 'react';
import { Button, Section, Text } from '@react-email/components';
import {
  cardStyle,
  contentSection,
  headingStyle,
  heroSection,
  listItemStyle,
  listStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  strongStyle,
  subheadingStyle,
} from '../common-styles';

export interface HeroBlockProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  children?: React.ReactNode;
}

export function HeroBlock({ title, subtitle, emoji, children }: HeroBlockProps) {
  return (
    <Section style={heroSection}>
      <Text style={headingStyle}>
        {emoji ? `${emoji} ` : ''}
        {title}
      </Text>
      {subtitle ? <Text style={subheadingStyle}>{subtitle}</Text> : null}
      {children}
    </Section>
  );
}

export interface BulletListItem {
  title: string;
  description?: string;
  emoji?: string;
}

export interface BulletListSectionProps {
  heading?: string;
  items: BulletListItem[];
}

export function BulletListSection({ heading, items }: BulletListSectionProps) {
  if (!items.length) return null;

  return (
    <Section style={contentSection}>
      {heading ? (
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>{heading}</strong>
        </Text>
      ) : null}
      <ul style={listStyle}>
        {items.map((item) => (
          <li key={item.title} style={listItemStyle}>
            <strong style={strongStyle}>
              {item.emoji ? `${item.emoji} ` : ''}
              {item.title}
            </strong>
            {item.description ? ` - ${item.description}` : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export interface CardListItem {
  title: string;
  description: string;
  meta?: string;
  cta?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
  };
}

export interface CardListSectionProps {
  title?: string;
  cards: CardListItem[];
}

export function CardListSection({ title, cards }: CardListSectionProps) {
  if (!cards.length) return null;

  return (
    <Section style={contentSection}>
      {title ? (
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>{title}</strong>
        </Text>
      ) : null}
      {cards.map((card) => (
        <Section key={card.title} style={cardStyle}>
          <Text style={paragraphStyle}>
            <strong style={strongStyle}>{card.title}</strong>
          </Text>
          {card.meta ? <Text style={paragraphStyle}>{card.meta}</Text> : null}
          <Text style={paragraphStyle}>{card.description}</Text>
          {card.cta ? (
            <Button
              href={card.cta.href}
              style={card.cta.variant === 'secondary' ? secondaryButtonStyle : primaryButtonStyle}
            >
              {card.cta.label}
            </Button>
          ) : null}
        </Section>
      ))}
    </Section>
  );
}
export interface StepCardItem {
  step: number;
  title: string;
  description: string;
  cta?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
  };
}

interface StepCardListProps {
  title?: string;
  steps: StepCardItem[];
}

export function StepCardList({ title, steps }: StepCardListProps) {
  if (!steps.length) return null;

  return (
    <Section style={contentSection}>
      {title ? (
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>{title}</strong>
        </Text>
      ) : null}
      {steps.map((step) => (
        <Section key={step.step} style={cardStyle}>
          <Text style={paragraphStyle}>
            <strong style={strongStyle}>{step.step}</strong>
          </Text>
          <Text style={paragraphStyle}>
            <strong style={strongStyle}>{step.title}</strong>
          </Text>
          <Text style={paragraphStyle}>{step.description}</Text>
          {step.cta ? (
            <Button
              href={step.cta.href}
              style={step.cta.variant === 'secondary' ? secondaryButtonStyle : primaryButtonStyle}
            >
              {step.cta.label}
            </Button>
          ) : null}
        </Section>
      ))}
    </Section>
  );
}
