import type React from 'react';
import { Section, Text } from '@react-email/components';
import { contentSection, paragraphStyle, strongStyle } from '../common-styles';

export interface JobDetailItem {
  label: string;
  value: React.ReactNode;
  icon?: string;
}

interface JobDetailsSectionProps {
  title?: string;
  items: JobDetailItem[];
}

export function JobDetailsSection({ title, items }: JobDetailsSectionProps) {
  if (!items.length) {
    return null;
  }

  return (
    <Section style={contentSection}>
      {title ? (
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>{title}</strong>
        </Text>
      ) : null}
      {items.map((item) => (
        <Text key={item.label} style={paragraphStyle}>
          {item.icon ? `${item.icon} ` : null}
          <strong style={strongStyle}>{item.label}:</strong> {item.value}
        </Text>
      ))}
    </Section>
  );
}
