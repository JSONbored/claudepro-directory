export interface Rule {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author: string;
  content: string;
  slug: string;
  category: 'development' | 'writing' | 'analysis' | 'creative' | 'business' | 'other';
  popularity: number;
  createdAt: string;
}

// Import all rules - keeping existing structure for now
import { typescriptRule } from './typescript';
import { reactRule } from './react';
import { nextjsRule } from './nextjs';
import { pythonRule } from './python';
import { writingRule } from './writing';
import { businessRule } from './business';
import { uiuxRule } from './uiux';
import { apiRule } from './api';

export const rules: Rule[] = [
  typescriptRule,
  reactRule,
  nextjsRule,
  pythonRule,
  writingRule,
  businessRule,
  uiuxRule,
  apiRule,
];

export const getRuleBySlug = (slug: string): Rule | undefined => {
  return rules.find(rule => rule.slug === slug);
};

export const getRulesByCategory = (category: string): Rule[] => {
  return rules.filter(rule => rule.category === category);
};

export const getPopularRules = (): Rule[] => {
  return rules.sort((a, b) => b.popularity - a.popularity);
};
