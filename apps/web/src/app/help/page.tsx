import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import {
  BookOpen,
  Code,
  FileText,
  HelpCircle,
  MessageSquare,
  Search,
} from '@heyclaude/web-runtime/icons';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HoverCard,
  NavLink,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
import { cacheLife } from 'next/cache';
import Link from 'next/link';

const helpTopics = [
  {
    description: 'Learn the basics of using ClaudePro Directory',
    icon: BookOpen,
    links: [
      { href: '/agents', label: 'Browse Configurations' },
      { href: '/guides', label: 'Understanding Categories' },
      { href: '/search', label: 'Search Tips' },
    ],
    title: 'Getting Started',
  },
  {
    description: 'Share your configurations with the community',
    icon: FileText,
    links: [
      { href: '/submit', label: 'Submission Guidelines' },
      { href: '/guides', label: 'Content Standards' },
      { href: '/submit', label: 'Review Process' },
    ],
    title: 'Submit Content',
  },
  {
    description: 'How to implement and customize configurations',
    icon: Code,
    links: [
      { href: '/agents', label: 'Agent Setup' },
      { href: '/mcp', label: 'MCP Servers' },
      { href: '/commands', label: 'Slash Commands' },
      { href: '/rules', label: 'Project Rules' },
    ],
    title: 'Using Configurations',
  },
  {
    description: 'Manage your account and preferences',
    icon: HelpCircle,
    links: [
      { href: '/auth/signin', label: 'Profile Settings' },
      { href: '/privacy', label: 'Privacy Settings' },
      { href: '/auth/signin', label: 'Notification Preferences' },
    ],
    title: 'Account & Settings',
  },
];

const commonQuestions = [
  {
    answer:
      'Visit the Submit page and fill out the form with your configuration details. No JSON formatting required - our team will review and format your submission.',
    link: { href: '/submit', label: 'Go to Submit Page' },
    question: 'How do I submit my own configuration?',
  },
  {
    answer:
      'We host 8 types of content: Agents, MCP Servers, Commands, Rules, Hooks, Statuslines, Skills, and Collections. Each helps you enhance your Claude Code workflow in different ways.',
    link: { href: '/agents', label: 'Browse Categories' },
    question: 'What types of content can I find here?',
  },
  {
    answer:
      'Use the search bar (⌘K or Ctrl+K) or click the search icon in the navigation. You can filter by category, tags, and search terms to find exactly what you need.',
    link: { href: '/search', label: 'Try Search' },
    question: 'How do I search for specific configurations?',
  },
  {
    answer:
      'Yes! All content on ClaudePro Directory is free and open-source. We believe in making AI development tools accessible to everyone.',
    link: null,
    question: 'Are all configurations free to use?',
  },
  {
    answer:
      'You can submit configurations, report issues on GitHub, join our Discord community, or become a partner. We welcome all forms of contribution!',
    link: { href: '/partner', label: 'Learn More' },
    question: 'How can I contribute to the project?',
  },
  {
    answer:
      'Agents are autonomous task executors that handle complex workflows, while Skills are focused capabilities for specific tasks (like PDF processing or spreadsheet handling). Skills enhance Claude Code with new abilities.',
    link: { href: '/skills', label: 'Explore Skills' },
    question: 'What is the difference between Agents and Skills?',
  },
];

/**
 * Render the Help Center page with topics, common questions, quick actions, and contact options.
 *
 * Renders a static help UI that lists help topics and links, frequently asked questions with optional links,
 * three quick-action cards (Search, Guides, Contact Support), and a "Still need help?" callout with contact actions.
 *
 * @returns A React element containing the full Help Center page.
 *
 * @see APP_CONFIG
 * @see NavLink
 * @see HoverCard
 * @see Card
 * @see revalidate - page is statically generated (revalidation controlled by this module)
 */
export default async function HelpPage() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Help Center</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Find answers, guides, and resources to get the most out of {APP_CONFIG.name}
        </p>
      </div>

      {/* Help Topics Grid */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold">Browse by Topic</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {helpTopics.map((topic) => (
            <Card key={topic.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <topic.icon className="text-accent h-5 w-5" />
                  {topic.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">{topic.description}</p>
                <ul className="space-y-2">
                  {topic.links.map((link) => (
                    <li key={link.label}>
                      <NavLink className="flex items-center gap-1 text-sm" href={link.href}>
                        {link.label} →
                      </NavLink>
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
        <h2 className="mb-6 text-2xl font-semibold">Common Questions</h2>
        <div className="space-y-6">
          {commonQuestions.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle className="flex items-start gap-2 text-lg">
                  <HelpCircle className="text-accent mt-0.5 h-5 w-5 shrink-0" />
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{item.answer}</p>
                {item.link ? (
                  <NavLink className="inline-flex items-center gap-1" href={item.link.href}>
                    {item.link.label} →
                  </NavLink>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="mb-6 text-2xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link className="block" href="/search">
            <HoverCard variant="strong">
              <Card className="h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-3">
                    <Search className="text-accent h-6 w-6" />
                    <h3 className="font-semibold">Search</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Find configurations and resources</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>

          <Link className="block" href="/guides">
            <HoverCard variant="strong">
              <Card className="h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-3">
                    <BookOpen className="text-accent h-6 w-6" />
                    <h3 className="font-semibold">Guides</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Browse tutorials and how-tos</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>

          <Link className="block" href="/contact">
            <HoverCard variant="strong">
              <Card className="h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-3">
                    <MessageSquare className="text-accent h-6 w-6" />
                    <h3 className="font-semibold">Contact Support</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Get help from our team</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>
        </div>
      </section>

      {/* Still Need Help */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold">Still need help?</h2>
            <p className="text-muted-foreground mb-4">Our community is here to assist you</p>
            <div className="flex justify-center gap-4">
              <NavLink
                className={`bg-accent inline-flex items-center gap-2 rounded-lg ${UI_CLASSES.CONTAINER_PADDING_SM} text-accent-foreground hover:bg-accent/90 transition-colors`}
                href="/contact"
              >
                <MessageSquare className="h-4 w-4" />
                Contact Us
              </NavLink>
              <Link
                className={`border-accent/20 inline-flex items-center gap-2 rounded-lg border ${UI_CLASSES.CONTAINER_PADDING_SM} hover:bg-accent/10 transition-colors`}
                href="/community"
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
