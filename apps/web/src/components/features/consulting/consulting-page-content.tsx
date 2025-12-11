'use client';

/**
 * Consulting Page - Modern Redesign with Motion.dev Animations
 *
 * This is a hybrid page combining "about me" (the creator of the website/project) with consulting services solicitation.
 * Comprehensive research and analysis has been conducted for modern consulting/about-me page patterns, motion.dev
 * animations, shadcn components, and Dec 2025 UX/UI standards. See .cursor/consulting-page-research.md for detailed
 * findings and implementation recommendations.
 *
 * Features:
 * - Hero section with animated gradient text and stats
 * - About section with personal story
 * - Services section with 3D cards and hover effects
 * - Experience/portfolio section
 * - Trust signals with animated counters
 * - Improved calendar embed (compact, better styled)
 * - Scroll-triggered animations throughout
 * - Microinteractions on all interactive elements
 */

import Cal, { getCalApi } from '@calcom/embed-react';
import {
  SPRING,
  MICROINTERACTIONS,
} from '@heyclaude/web-runtime/design-system';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  NumberTicker,
  AnimatedGradientText,
  MagneticButton,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Code,
  Database,
  Server,
  Network,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Github,
  Mail,
  ExternalLink,
} from 'lucide-react';

export function ConsultingClient() {
  const [calReady, setCalReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cal = await getCalApi({ namespace: 'consulting-call' });
        cal('ui', {
          theme: 'dark',
          styles: {
            branding: { brandColor: 'rgb(249, 115, 22)' }, // Claude orange
          },
          hideEventTypeDetails: false,
          layout: 'month_view',
        });
        setCalReady(true);
      } catch (error: unknown) {
        logClientError(
          '[Consulting] Failed to initialize Cal.com',
          normalizeError(error, 'Failed to initialize Cal.com'),
          'ConsultingClient.initCal',
          {
            component: 'ConsultingClient',
            action: 'init-cal',
            category: 'consulting',
            namespace: 'consulting-call',
          }
        );
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-orange-500/10 animate-pulse" />
        
        {/* Particles Effect (simplified with CSS) */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16 sm:px-6 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING.smooth, delay: 0.1 }}
              className="inline-flex"
            >
              <UnifiedBadge variant="base" className="border-orange-500/30 bg-orange-500/10 text-orange-400">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Available for New Projects
              </UnifiedBadge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              <span className="block mb-2">Let's Build</span>
              <AnimatedGradientText className="block">
                Something Together
              </AnimatedGradientText>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.3 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              I'm <strong className="text-foreground">ghost (JSONbored)</strong> — a
              multi-disciplined engineer who's spent years building infrastructure, applications,
              and systems that actually work.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <MagneticButton>
                <Button
                  size="lg"
                  className="text-base px-8 py-6"
                  onClick={() => {
                    document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Book a Free Call
                </Button>
              </MagneticButton>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6"
                asChild
              >
                <Link href="#experience">
                  View My Work
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.5,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/50"
            >
              {[
                { label: 'Years Experience', value: 3, suffix: '+' },
                { label: 'Assets Secured', value: 100, suffix: 'MM+' },
                { label: 'Monthly Visitors', value: 1000, suffix: '+' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold mb-2">
                    <NumberTicker value={stat.value} delay={index * 100} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <LazySection variant="slide-up" className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={SPRING.smooth}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">About Me</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A jack-of-all-trades engineer who ships production systems, not demos.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Profile Image Placeholder */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={SPRING.smooth}
                className="relative"
              >
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-border/50 flex items-center justify-center">
                  <div className="text-6xl">👨‍💻</div>
                </div>
              </motion.div>

              {/* Story Content */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={SPRING.smooth}
                className="space-y-6"
              >
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">What I do:</strong> Full-stack development,
                    blockchain infrastructure, network engineering, systems administration, DevOps, AI/LLM
                    engineering, and database design. I'm a jack-of-all-trades who ships production
                    systems, not demos.
                  </p>

                  <p>
                    <strong className="text-foreground">Experience:</strong> Spent 3+ years running Cosmos
                    blockchain validators (securing $100MM+ in network assets). Built{' '}
                    <Link href="/" className="text-orange-500 hover:text-orange-400 underline underline-offset-4 transition-colors">
                      Claude Pro Directory
                    </Link>{' '}
                    (
                    <a
                      href="https://github.com/jsonbored/claudepro-directory"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-400 underline underline-offset-4 transition-colors inline-flex items-center gap-1"
                    >
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    ) — an open-source directory for Claude AI templates and workflows with thousands of
                    monthly visitors. Worked across the full stack from bare metal infrastructure to
                    frontend UX.
                  </p>

                  <p>
                    <strong className="text-foreground">Tech stack:</strong> I work with whatever tools
                    make sense for the job. Currently building with Next.js 16, React 19, TypeScript,
                    PostgreSQL, and TailwindCSS v4 — but I've worked with many other stacks and adapt to
                    your project's needs.
                  </p>
                </div>

                {/* Contact Links */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href="mailto:ghost@zeronode.sh" className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      ghost@zeronode.sh
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://github.com/jsonbored"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/" className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Claude Pro Directory
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </LazySection>

      {/* Services Section */}
      <LazySection variant="slide-up" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What I Do</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive engineering services for modern applications
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2,
                },
              },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {[
              {
                icon: Code,
                title: 'Full-Stack Development',
                description: 'End-to-end application development from database design to polished UI. React, Next.js, TypeScript, and modern web technologies.',
                color: 'from-blue-500/20 to-cyan-500/20',
                borderColor: 'border-blue-500/30',
              },
              {
                icon: Network,
                title: 'Blockchain Infrastructure',
                description: 'Validator operations, network security, and protocol development. Experience with Cosmos SDK and securing $100MM+ in assets.',
                color: 'from-purple-500/20 to-pink-500/20',
                borderColor: 'border-purple-500/30',
              },
              {
                icon: Server,
                title: 'DevOps & Infrastructure',
                description: 'CI/CD pipelines, cloud architecture, system administration, and infrastructure automation. From bare metal to cloud-native.',
                color: 'from-orange-500/20 to-red-500/20',
                borderColor: 'border-orange-500/30',
              },
              {
                icon: Database,
                title: 'Database Design',
                description: 'PostgreSQL optimization, schema design, query performance tuning, and data architecture for scalable applications.',
                color: 'from-green-500/20 to-emerald-500/20',
                borderColor: 'border-green-500/30',
              },
              {
                icon: Sparkles,
                title: 'AI/LLM Engineering',
                description: 'Building AI-powered applications, prompt engineering, and integrating LLMs into production systems effectively.',
                color: 'from-yellow-500/20 to-amber-500/20',
                borderColor: 'border-yellow-500/30',
              },
              {
                icon: TrendingUp,
                title: 'Systems Architecture',
                description: 'Designing scalable, maintainable systems that grow with your business. From monoliths to microservices and beyond.',
                color: 'from-indigo-500/20 to-violet-500/20',
                borderColor: 'border-indigo-500/30',
              },
            ].map((service) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  variants={{
                    hidden: { opacity: 0, y: 50 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{
                    ...MICROINTERACTIONS.card.hover,
                    y: -8,
                  }}
                  whileTap={MICROINTERACTIONS.card.tap}
                  transition={MICROINTERACTIONS.card.transition}
                >
                  <Card className={`h-full border-2 ${service.borderColor} bg-gradient-to-br ${service.color} backdrop-blur-sm hover:shadow-xl transition-shadow`}>
                    <CardHeader>
                      <div className="mb-4">
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${service.color} border ${service.borderColor}`}>
                          <Icon className="h-6 w-6 text-foreground" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {service.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </LazySection>

      {/* Experience Section */}
      <div id="experience">
        <LazySection variant="slide-up" className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Experience & Projects</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real projects, real results, real systems in production
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Claude Pro Directory */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={SPRING.smooth}
            >
              <Card className="h-full border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-purple-500/10 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                        <Sparkles className="h-5 w-5 text-orange-400" />
                      </div>
                      <CardTitle className="text-xl">Claude Pro Directory</CardTitle>
                    </div>
                    <UnifiedBadge variant="base" className="border-orange-500/30">
                      Active
                    </UnifiedBadge>
                  </div>
                  <CardDescription className="text-base">
                    Open-source directory for Claude AI templates and workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Thousands of monthly visitors</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>Open source & community-driven</span>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/" className="inline-flex items-center justify-center gap-2">
                      View Project
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Blockchain Validators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...SPRING.smooth, delay: 0.1 }}
            >
              <Card className="h-full border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <Network className="h-5 w-5 text-purple-400" />
                      </div>
                      <CardTitle className="text-xl">Blockchain Validators</CardTitle>
                    </div>
                    <UnifiedBadge variant="base" className="border-purple-500/30">
                      3+ Years
                    </UnifiedBadge>
                  </div>
                  <CardDescription className="text-base">
                    Cosmos blockchain validator operations and network security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>$100MM+ in network assets secured</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>Production infrastructure expertise</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
        </LazySection>
      </div>

      {/* Trust Signals Section */}
      <LazySection variant="slide-up" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Work With Me</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Proven track record of shipping production systems that scale
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2,
                },
              },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {[
              { icon: Award, label: 'Production Systems', value: '100%', description: 'No demos, only real systems' },
              { icon: TrendingUp, label: 'Assets Secured', value: '100', suffix: 'MM+', description: 'Blockchain infrastructure' },
              { icon: Users, label: 'Monthly Visitors', value: '1000', suffix: '+', description: 'Active projects' },
              { icon: Sparkles, label: 'Open Source', value: '1', description: 'Community-driven projects' },
            ].map((stat, statIndex) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    show: { opacity: 1, scale: 1 },
                  }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  transition={SPRING.smooth}
                  className="text-center p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
                >
                  <div className="inline-flex p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 mb-4">
                    <Icon className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    {stat.value.includes('%') ? (
                      <>
                        <NumberTicker value={parseFloat(stat.value)} delay={statIndex * 150} decimalPlaces={0} />
                        <span>%</span>
                      </>
                    ) : (
                      <NumberTicker
                        value={parseFloat(stat.value)}
                        delay={statIndex * 150}
                        suffix={stat.suffix || ''}
                        decimalPlaces={0}
                      />
                    )}
                  </div>
                  <div className="text-sm font-semibold mb-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </LazySection>

      {/* CTA Section */}
      <LazySection variant="slide-up" className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Ready to Build Something Together?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                I'm accepting new projects now. Book a free 15-minute discovery call below — I'll tell you honestly if I'm a good fit or not.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton>
                <Button
                  size="lg"
                  className="text-base px-8 py-6"
                  onClick={() => {
                    document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Book Your Free Call
                </Button>
              </MagneticButton>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6"
                asChild
              >
                <a href="mailto:ghost@zeronode.sh" className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Me Instead
                </a>
              </Button>
            </div>

            <div className="pt-8 space-y-2 text-sm text-muted-foreground">
              <p>✓ 15-minute discovery call (free)</p>
              <p>✓ Honest assessment of fit</p>
              <p>✓ No pressure, no commitment</p>
            </div>
          </motion.div>
        </div>
      </LazySection>

      {/* Calendar Section */}
      <div id="calendar-section">
        <LazySection variant="slide-up" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Book Your Free Discovery Call
              </h2>
              <p className="text-muted-foreground text-lg">
                Choose a time that works for you. I'll send a calendar invite with a video call link.
              </p>
            </div>

            {/* Compact Calendar Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={SPRING.smooth}
              className="relative"
            >
              <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative" style={{ minHeight: '600px', maxHeight: '800px' }}>
                    {calReady ? (
                      <Cal
                        calLink="jsonbored/heyclaude-consult"
                        config={{
                          theme: 'dark',
                          layout: 'month_view',
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '600px',
                          maxHeight: '800px',
                          overflow: 'hidden',
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[600px]">
                        <div className="text-center space-y-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
                          <p className="text-muted-foreground">Loading calendar...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Alternative Contact */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ...SPRING.smooth, delay: 0.3 }}
              className="text-center mt-8 text-sm text-muted-foreground"
            >
              <p>
                Prefer email?{' '}
                <a href="mailto:ghost@zeronode.sh" className="text-orange-500 hover:text-orange-400 underline underline-offset-4 transition-colors">
                  ghost@zeronode.sh
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
        </LazySection>
      </div>
    </div>
  );
}
