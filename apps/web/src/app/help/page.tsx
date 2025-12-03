import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import {
  bgColor,
  borderColor,
  cluster,
  container,
  cursor,
  display,
  flexGrow,
  gap,
  grid,
  height,
  hoverBg,
  iconSize,
  justify,
  marginBottom,
  marginTop,
  marginX,
  maxWidth,
  muted,
  padding,
  paddingTop,
  radius,
  responsiveText,
  row,
  size,
  spaceY,
  textAlign,
  textColor,
  transition,
  weight,
} from '@heyclaude/web-runtime/design-system';
import {
  BookOpen,
  Code,
  FileText,
  HelpCircle,
  type IconComponent,
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
    icon: BookOpen as IconComponent,
    description: 'Learn the basics of using ClaudePro Directory',
    links: [
      { label: 'Browse Configurations', href: '/agents' },
      { label: 'Understanding Categories', href: '/guides' },
      { label: 'Search Tips', href: '/search' },
    ],
  },
  {
    title: 'Submit Content',
    icon: FileText as IconComponent,
    description: 'Share your configurations with the community',
    links: [
      { label: 'Submission Guidelines', href: '/submit' },
      { label: 'Content Standards', href: '/guides' },
      { label: 'Review Process', href: '/submit' },
    ],
  },
  {
    title: 'Using Configurations',
    icon: Code as IconComponent,
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
    icon: HelpCircle as IconComponent,
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

/**
 * Renders the Help Center page displaying help topics, common questions, quick actions, and contact options.
 *
 * This presentational component builds the page from static in-file data and uses UI primitives (cards, nav links, hover cards)
 * to surface topics, FAQs, quick actions, and a final call-to-action for contacting support or joining the community.
 *
 * @returns The `JSX.Element` for the Help Center page.
 *
 * @see APP_CONFIG
 * @see NavLink
 * @see HoverCard
 */
export default function HelpPage() {
  return (
    <div className={`${container.default} ${maxWidth['6xl']} ${padding.xDefault} ${padding.yRelaxed} sm:py-12`}>
      <div className={`${marginBottom.section} ${textAlign.center}`}>
        <h1 className={`${marginBottom.default} ${weight.bold} ${responsiveText['3xl']}`}>Help Center</h1>
        <p className={`${marginX.auto} ${maxWidth['2xl']} ${muted.lg}`}>
          Find answers, guides, and resources to get the most out of {APP_CONFIG.name}
        </p>
      </div>

      {/* Help Topics Grid */}
      <section className={marginBottom.hero}>
        <h2 className={`${marginBottom.comfortable} ${weight.semibold} ${size['2xl']}`}>Browse by Topic</h2>
        <div className={grid.responsive4}>
          {helpTopics.map((topic) => (
            <Card key={topic.title}>
              <CardHeader>
                <CardTitle className={`${cluster.compact} ${size.base}`}>
                  <topic.icon className={`${iconSize.md} ${textColor.accent}`} />
                  {topic.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${marginBottom.default} ${muted.sm}`}>{topic.description}</p>
                <ul className={spaceY.compact}>
                  {topic.links.map((link) => (
                    <li key={link.label}>
                      <NavLink href={link.href} className={`${display.inlineFlex} ${gap.tight} ${size.sm}`}>
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
      <section className={marginBottom.hero}>
        <h2 className={`${marginBottom.comfortable} ${weight.semibold} ${size['2xl']}`}>Common Questions</h2>
        <div className={spaceY.relaxed}>
          {commonQuestions.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle className={`${row.compact} ${size.lg}`}>
                  <HelpCircle className={`${marginTop.micro} ${iconSize.md} ${flexGrow.shrink0} ${textColor.accent}`} />
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${marginBottom.compact} ${muted.default}`}>{item.answer}</p>
                {item.link ? <NavLink href={item.link.href} className={`${display.inlineFlex} ${gap.tight}`}>
                    {item.link.label} →
                  </NavLink> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className={marginBottom.relaxed}>
        <h2 className={`${marginBottom.comfortable} ${weight.semibold} ${size['2xl']}`}>Quick Actions</h2>
        <div className={grid.responsive13Gap4}>
          <Link href="/search" className={display.block}>
            <HoverCard variant="strong">
              <Card className={`${height.full} ${cursor.pointer}`}>
                <CardContent className={paddingTop.relaxed}>
                  <div className={`${marginBottom.micro} ${cluster.default}`}>
                    <Search className={`${iconSize.lg} ${textColor.accent}`} />
                    <h3 className={weight.semibold}>Search</h3>
                  </div>
                  <p className={muted.sm}>Find configurations and resources</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>

          <Link href="/guides" className={display.block}>
            <HoverCard variant="strong">
              <Card className={`${height.full} ${cursor.pointer}`}>
                <CardContent className={paddingTop.relaxed}>
                  <div className={`${marginBottom.micro} ${cluster.default}`}>
                    <BookOpen className={`${iconSize.lg} ${textColor.accent}`} />
                    <h3 className={weight.semibold}>Guides</h3>
                  </div>
                  <p className={muted.sm}>Browse tutorials and how-tos</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>

          <Link href="/contact" className={display.block}>
            <HoverCard variant="strong">
              <Card className={`${height.full} ${cursor.pointer}`}>
                <CardContent className={paddingTop.relaxed}>
                  <div className={`${marginBottom.micro} ${cluster.default}`}>
                    <MessageSquare className={`${iconSize.lg} ${textColor.accent}`} />
                    <h3 className={weight.semibold}>Contact Support</h3>
                  </div>
                  <p className={muted.sm}>Get help from our team</p>
                </CardContent>
              </Card>
            </HoverCard>
          </Link>
        </div>
      </section>

      {/* Still Need Help */}
      <Card className={`${borderColor['accent/20']} ${bgColor['accent/5']}`}>
        <CardContent className={paddingTop.relaxed}>
          <div className={textAlign.center}>
            <h2 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>Still need help?</h2>
            <p className={`${marginBottom.default} ${muted.default}`}>Our community is here to assist you</p>
            <div className={`${display.flex} ${justify.center} ${gap.comfortable}`}>
              <NavLink
                href="/contact"
                className={`${display.inlineFlex} ${gap.compact} ${radius.lg} ${bgColor.accent} ${padding.xCompact} ${padding.yCompact} ${textColor.accentForeground} ${transition.colors} ${hoverBg.max}`}
              >
                <MessageSquare className={iconSize.sm} />
                Contact Us
              </NavLink>
              <Link
                href="/community"
                className={`${cluster.compact} ${radius.lg} border ${borderColor['accent/20']} ${padding.xCompact} ${padding.yCompact} ${transition.colors} ${hoverBg.default}`}
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