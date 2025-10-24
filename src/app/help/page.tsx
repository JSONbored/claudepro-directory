import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { APP_CONFIG } from '@/src/lib/constants';
import { BookOpen, Code, FileText, HelpCircle, MessageSquare, Search } from '@/src/lib/icons';

export const metadata: Metadata = {
  title: `Help Center - ${APP_CONFIG.name}`,
  description: `Help Center for ${APP_CONFIG.name}. Find guides, tutorials, and answers to common questions about using our Claude AI configuration directory.`,
};

const helpTopics = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Learn the basics of using ClaudePro Directory',
    links: [
      { label: 'Browse Configurations', href: '/agents' },
      { label: 'Understanding Categories', href: '/guides' },
      { label: 'Search Tips', href: '/search' },
    ],
  },
  {
    title: 'Submit Content',
    icon: FileText,
    description: 'Share your configurations with the community',
    links: [
      { label: 'Submission Guidelines', href: '/submit' },
      { label: 'Content Standards', href: '/guides' },
      { label: 'Review Process', href: '/submit' },
    ],
  },
  {
    title: 'Using Configurations',
    icon: Code,
    description: 'How to implement and customize configurations',
    links: [
      { label: 'Agent Setup', href: '/agents' },
      { label: 'MCP Servers', href: '/mcp' },
      { label: 'Slash Commands', href: '/commands' },
      { label: 'Project Rules', href: '/rules' },
    ],
  },
  {
    title: 'Account & Settings',
    icon: HelpCircle,
    description: 'Manage your account and preferences',
    links: [
      { label: 'Profile Settings', href: '/auth/signin' },
      { label: 'Privacy Settings', href: '/privacy' },
      { label: 'Notification Preferences', href: '/auth/signin' },
    ],
  },
];

const commonQuestions = [
  {
    question: 'How do I submit my own configuration?',
    answer:
      'Visit the Submit page and fill out the form with your configuration details. No JSON formatting required - our team will review and format your submission.',
    link: { label: 'Go to Submit Page', href: '/submit' },
  },
  {
    question: 'What types of content can I find here?',
    answer:
      'We host 8 types of content: Agents, MCP Servers, Commands, Rules, Hooks, Statuslines, Skills, and Collections. Each helps you enhance your Claude Code workflow in different ways.',
    link: { label: 'Browse Categories', href: '/agents' },
  },
  {
    question: 'How do I search for specific configurations?',
    answer:
      'Use the search bar (⌘K or Ctrl+K) or click the search icon in the navigation. You can filter by category, tags, and search terms to find exactly what you need.',
    link: { label: 'Try Search', href: '/search' },
  },
  {
    question: 'Are all configurations free to use?',
    answer:
      'Yes! All content on ClaudePro Directory is free and open-source. We believe in making AI development tools accessible to everyone.',
    link: null,
  },
  {
    question: 'How can I contribute to the project?',
    answer:
      'You can submit configurations, report issues on GitHub, join our Discord community, or become a partner. We welcome all forms of contribution!',
    link: { label: 'Learn More', href: '/partner' },
  },
  {
    question: 'What is the difference between Agents and Skills?',
    answer:
      'Agents are autonomous task executors that handle complex workflows, while Skills are focused capabilities for specific tasks (like PDF processing or spreadsheet handling). Skills enhance Claude Code with new abilities.',
    link: { label: 'Explore Skills', href: '/skills' },
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Find answers, guides, and resources to get the most out of {APP_CONFIG.name}
        </p>
      </div>

      {/* Help Topics Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Browse by Topic</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {helpTopics.map((topic) => (
            <Card key={topic.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <topic.icon className="h-5 w-5 text-accent" />
                  {topic.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>
                <ul className="space-y-2">
                  {topic.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-accent hover:underline flex items-center gap-1"
                      >
                        {link.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Common Questions */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Common Questions</h2>
        <div className="space-y-6">
          {commonQuestions.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{item.answer}</p>
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="text-accent hover:underline inline-flex items-center gap-1"
                  >
                    {item.link.label} →
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/search" className="block">
            <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Search className="h-6 w-6 text-accent" />
                  <h3 className="font-semibold">Search</h3>
                </div>
                <p className="text-sm text-muted-foreground">Find configurations and resources</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guides" className="block">
            <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-6 w-6 text-accent" />
                  <h3 className="font-semibold">Guides</h3>
                </div>
                <p className="text-sm text-muted-foreground">Browse tutorials and how-tos</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/contact" className="block">
            <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-6 w-6 text-accent" />
                  <h3 className="font-semibold">Contact Support</h3>
                </div>
                <p className="text-sm text-muted-foreground">Get help from our team</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Still Need Help */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
            <p className="text-muted-foreground mb-4">Our community is here to assist you</p>
            <div className="flex justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Contact Us
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 px-4 py-2 border border-accent/20 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Join Community
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
