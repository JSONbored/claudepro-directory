import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import {
  BookOpen,
  Code,
  FileText,
  HelpCircle,
  MessageSquare,
  Search,
} from '@heyclaude/web-runtime/icons';
import { NavLink, HoverCard , Card, CardContent, CardHeader, CardTitle   } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';


/**
 * Static Generation: Help page is fully static content
 * No dynamic data fetching - can be pre-rendered at build time
 */
export const revalidate = false;

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
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-bold text-3xl sm:text-4xl">Help Center</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Find answers, guides, and resources to get the most out of {APP_CONFIG.name}
        </p>
      </div>

      {/* Help Topics Grid */}
      <section className="mb-16">
        <h2 className="mb-6 font-semibold text-2xl">Browse by Topic</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {helpTopics.map((topic) => (
            <Card key={topic.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <topic.icon className="h-5 w-5 text-accent" />
                  {topic.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">{topic.description}</p>
                <ul className="space-y-2">
                  {topic.links.map((link) => (
                    <li key={link.label}>
                      <NavLink href={link.href} className="flex items-center gap-1 text-sm">
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
        <h2 className="mb-6 font-semibold text-2xl">Common Questions</h2>
        <div className="space-y-6">
          {commonQuestions.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle className="flex items-start gap-2 text-lg">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-muted-foreground">{item.answer}</p>
                {item.link ? <NavLink href={item.link.href} className="inline-flex items-center gap-1">
                    {item.link.label} →
                  </NavLink> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="mb-6 font-semibold text-2xl">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/search" className="block">
            <HoverCard variant="strong">
              <Card className="h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-3">
                    <Search className="h-6 w-6 text-accent" />
                    <h3 className="font-semibold">Search</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Find configurations and resources</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>

          <Link href="/guides" className="block">
            <HoverCard variant="strong">
              <Card className="h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-accent" />
                    <h3 className="font-semibold">Guides</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Browse tutorials and how-tos</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>

          <Link href="/contact" className="block">
            <HoverCard variant="strong">
              <Card className="h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-accent" />
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
            <h2 className="mb-2 font-semibold text-xl">Still need help?</h2>
            <p className="mb-4 text-muted-foreground">Our community is here to assist you</p>
            <div className="flex justify-center gap-4">
              <NavLink
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <MessageSquare className="h-4 w-4" />
                Contact Us
              </NavLink>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-lg border border-accent/20 px-3 py-2 transition-colors hover:bg-accent/10"
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
