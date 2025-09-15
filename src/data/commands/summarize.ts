import { Command } from './index';

export const summarizeCommand: Command = {
  id: 'summarize',
  title: '/summarize',
  description: 'Generate concise, intelligent summaries of documents, articles, code, and multimedia content',
  author: 'Claude Pro Community',
  category: 'productivity',
  tags: ['summarization', 'content', 'analysis', 'productivity', 'reading'],
  content: `# /summarize Command

Create intelligent summaries of various content types with customizable length, focus, and format options.

## Content Types Supported:

### Text Documents
- Articles, blog posts, and news
- Research papers and reports
- Documentation and manuals
- Meeting notes and transcripts
- Books and long-form content

### Code Analysis
- Codebase overviews and architecture
- Function and class summaries
- API documentation summaries
- Change logs and release notes
- Code review summaries

### Multimedia Content
- Video transcripts and presentations
- Podcast episodes and interviews
- Webinar content and lectures
- Image content and descriptions
- Social media threads and discussions

## Summary Styles:

### Executive Summary
- Key points and conclusions
- Business implications
- Action items and recommendations
- Strategic insights

### Technical Summary
- Implementation details
- Architecture overview
- Dependencies and requirements
- Performance considerations

### Bullet Points
- Structured key points
- Easy to scan format
- Hierarchical organization
- Quick reference style

## Features:
- Adjustable length (brief, standard, detailed)
- Focus areas (main points, technical details, business impact)
- Multiple output formats (prose, bullets, structured)
- Keyword extraction and tagging
- Sentiment analysis integration

Perfect for research, content curation, and information management workflows.`,
  slug: 'summarize',
  popularity: 93,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
  featured: true,
  syntax: '/summarize [content|file|url] [--length=brief|standard|detailed] [--style=executive|technical|bullets] [--focus=main|technical|business]',
  parameters: [
    {
      name: 'source',
      type: 'string',
      required: true,
      description: 'Content to summarize (text, file path, or URL)'
    },
    {
      name: 'length',
      type: 'string',
      required: false,
      description: 'Summary length: brief (1-2 sentences), standard (paragraph), detailed (multiple paragraphs)',
      default: 'standard'
    },
    {
      name: 'style',
      type: 'string',
      required: false,
      description: 'Summary style: executive, technical, or bullets',
      default: 'executive'
    },
    {
      name: 'focus',
      type: 'string',
      required: false,
      description: 'Focus area: main points, technical details, or business impact',
      default: 'main'
    }
  ],
  examples: [
    {
      title: 'Summarize research paper',
      command: '/summarize research-paper.pdf --length=detailed --style=technical',
      description: 'Detailed technical summary of a research document'
    },
    {
      title: 'Quick article summary',
      command: '/summarize https://example.com/article --length=brief --style=bullets',
      description: 'Brief bullet-point summary of an online article'
    },
    {
      title: 'Codebase overview',
      command: '/summarize ./src --style=technical --focus=technical',
      description: 'Technical summary of codebase structure and functionality'
    }
  ],
  platforms: ['CLI', 'Web', 'Browser Extension'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/commands/summarize.ts'
};