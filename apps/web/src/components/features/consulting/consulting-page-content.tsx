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
import { SPRING, MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
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
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useEffect } from 'react';
import { cn } from '@heyclaude/web-runtime/ui';
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
  const { value: calReady, setTrue: setCalReadyTrue } = useBoolean();
  const shouldReduceMotion = useReducedMotion();

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
        setCalReadyTrue();
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
      <section className="flex-center relative min-h-screen overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-orange-500/10" />

        {/* Particles Effect (simplified with CSS) */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 h-2 w-2 animate-ping rounded-full bg-primary [animation-delay:0s] [animation-duration:3s]" />
          <div className="absolute top-1/3 right-1/4 h-1.5 w-1.5 animate-ping rounded-full bg-primary [animation-delay:1s] [animation-duration:4s]" />
          <div className="absolute bottom-1/4 left-1/3 h-1 w-1 animate-ping rounded-full bg-primary/80 [animation-delay:2s] [animation-duration:5s]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-4 sm:px-6 sm:py-4">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={SPRING.smooth}
            className="mx-auto max-w-4xl space-y-6 text-center"
          >
            {/* Badge */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ ...SPRING.smooth, delay: 0.1 }}
              className="inline-flex"
            >
              <UnifiedBadge
                variant="base"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                <Sparkles className="mr-0.5 h-3 w-3" />
                Available for New Projects
              </UnifiedBadge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.2 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="mb-2 block">Let's Build</span>
              <AnimatedGradientText className="block">Something Together</AnimatedGradientText>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.3 }}
              className={cn(
                'text-lg sm:text-xl',
                'text-muted-foreground',
                'mx-auto max-w-2xl',
                'leading-relaxed'
              )}
            >
              I'm <strong className="text-foreground">ghost (JSONbored)</strong> — a
              multi-disciplined engineer who's spent years building infrastructure, applications,
              and systems that actually work.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.4 }}
              className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <MagneticButton>
                <Button
                  size="lg"
                  className="px-8 py-6 text-base"
                  onClick={() => {
                    document
                      .getElementById('calendar-section')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Book a Free Call
                </Button>
              </MagneticButton>
              <Button variant="outline" size="lg" className="px-8 py-6 text-base" asChild>
                <Link href="#experience">View My Work</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={
                shouldReduceMotion
                  ? {
                      hidden: { opacity: 0 },
                      show: { opacity: 1 },
                    }
                  : {
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: 0.5,
                        },
                      },
                    }
              }
              initial="hidden"
              animate="show"
              className="border-border/50 mt-4 grid grid-cols-1 gap-6 border-t pt-4 sm:grid-cols-3"
            >
              {[
                { label: 'Years Experience', value: 3, suffix: '+' },
                { label: 'Assets Secured', value: 100, suffix: 'MM+' },
                { label: 'Monthly Visitors', value: 1000, suffix: '+' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={
                    shouldReduceMotion
                      ? {
                          hidden: { opacity: 0 },
                          show: { opacity: 1 },
                        }
                      : {
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }
                  }
                  className="text-center"
                >
                  <div className="mb-2 text-3xl font-bold sm:text-4xl">
                    <NumberTicker value={stat.value} delay={index * 100} suffix={stat.suffix} />
                  </div>
                  <div className={cn('text-muted-foreground text-sm')}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <LazySection variant="slide-up" className="bg-background py-4">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={SPRING.smooth}
              className="mb-16 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">About Me</h2>
              <p className={cn('text-muted-foreground', 'text-lg', 'mx-auto max-w-2xl')}>
                A jack-of-all-trades engineer who ships production systems, not demos.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
              {/* Profile Image Placeholder */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -30 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={SPRING.smooth}
                className="relative"
              >
                <div className="border-border/50 flex-center aspect-square rounded-2xl border bg-gradient-to-br from-orange-500/20 to-purple-500/20">
                  <div className="text-6xl">👨‍💻</div>
                </div>
              </motion.div>

              {/* Story Content */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 30 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={SPRING.smooth}
                className="space-y-4"
              >
                <div className={cn('space-y-3', 'text-muted-foreground')}>
                  <p>
                    <strong className="text-foreground">What I do:</strong> Full-stack development,
                    blockchain infrastructure, network engineering, systems administration, DevOps,
                    AI/LLM engineering, and database design. I'm a jack-of-all-trades who ships
                    production systems, not demos.
                  </p>

                  <p>
                    <strong className="text-foreground">Experience:</strong> Spent 3+ years running
                    Cosmos blockchain validators (securing $100MM+ in network assets). Built{' '}
                    <Link
                      href="/"
                      className={`text-primary underline underline-offset-4 transition-colors hover:text-primary/80`}
                    >
                      Claude Pro Directory
                    </Link>{' '}
                    (
                    <a
                      href="https://github.com/jsonbored/claudepro-directory"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-primary underline underline-offset-4 transition-colors hover:text-primary/80`}
                    >
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    ) — an open-source directory for Claude AI templates and workflows with
                    thousands of monthly visitors. Worked across the full stack from bare metal
                    infrastructure to frontend UX.
                  </p>

                  <p>
                    <strong className="text-foreground">Tech stack:</strong> I work with whatever
                    tools make sense for the job. Currently building with Next.js 16, React 19,
                    TypeScript, PostgreSQL, and TailwindCSS v4 — but I've worked with many other
                    stacks and adapt to your project's needs.
                  </p>
                </div>

                {/* Contact Links */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="mailto:ghost@zeronode.sh"
                      className={cn('inline-flex', 'flex items-center', 'gap-2')}
                    >
                      <Mail className="h-4 w-4" />
                      ghost@zeronode.sh
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://github.com/jsonbored"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('inline-flex', 'flex items-center', 'gap-2')}
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/" className={cn('inline-flex', 'flex items-center', 'gap-2')}>
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
      <LazySection variant="slide-up" className="bg-muted/30 py-4">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">What I Do</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
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
            className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                icon: Code,
                title: 'Full-Stack Development',
                description:
                  'End-to-end application development from database design to polished UI. React, Next.js, TypeScript, and modern web technologies.',
                color: 'from-[var(--color-info-bg)] to-[var(--color-info-bg)]',
                borderColor: 'border-[var(--color-info-border)]',
              },
              {
                icon: Network,
                title: 'Blockchain Infrastructure',
                description:
                  'Validator operations, network security, and protocol development. Experience with Cosmos SDK and securing $100MM+ in assets.',
                color: 'from-primary/10 to-primary/10',
                borderColor: 'border-primary/30',
              },
              {
                icon: Server,
                title: 'DevOps & Infrastructure',
                description:
                  'CI/CD pipelines, cloud architecture, system administration, and infrastructure automation. From bare metal to cloud-native.',
                color: 'from-primary/10 to-primary/10',
                borderColor: 'border-primary/30',
              },
              {
                icon: Database,
                title: 'Database Design',
                description:
                  'PostgreSQL optimization, schema design, query performance tuning, and data architecture for scalable applications.',
                color: 'from-[var(--color-success-bg)] to-[var(--color-success-bg)]',
                borderColor: 'border-[var(--color-success-border)]',
              },
              {
                icon: Sparkles,
                title: 'AI/LLM Engineering',
                description:
                  'Building AI-powered applications, prompt engineering, and integrating LLMs into production systems effectively.',
                color: 'from-[var(--color-warning-bg)] to-[var(--color-warning-bg)]',
                borderColor: 'border-[var(--color-warning-border)]',
              },
              {
                icon: TrendingUp,
                title: 'Systems Architecture',
                description:
                  'Designing scalable, maintainable systems that grow with your business. From monoliths to microservices and beyond.',
                color: 'from-[var(--color-info-bg)] to-[var(--color-info-bg)]',
                borderColor: 'border-[var(--color-info-border)]',
              },
            ].map((service) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  variants={
                    shouldReduceMotion
                      ? {
                          hidden: { opacity: 0 },
                          show: { opacity: 1 },
                        }
                      : {
                          hidden: { opacity: 0, y: 50 },
                          show: { opacity: 1, y: 0 },
                        }
                  }
                  whileHover={
                    shouldReduceMotion
                      ? {}
                      : {
                          ...MICROINTERACTIONS.card.hover,
                          y: -8,
                        }
                  }
                  whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
                  transition={MICROINTERACTIONS.card.transition}
                >
                  <Card
                    className={`h-full border-2 ${service.borderColor} bg-gradient-to-br ${service.color} backdrop-blur-sm transition-shadow hover:shadow-xl`}
                  >
                    <CardHeader>
                      <div className="mb-4">
                        <div
                          className={`inline-flex rounded-lg bg-gradient-to-br p-3 ${service.color} border ${service.borderColor}`}
                        >
                          <Icon className="text-foreground h-6 w-6" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
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
        <LazySection variant="slide-up" className="bg-background py-4">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={SPRING.smooth}
              className="mb-16 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Experience & Projects</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                Real projects, real results, real systems in production
              </p>
            </motion.div>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              {/* Claude Pro Directory */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={SPRING.smooth}
              >
                <Card className="h-full border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-primary/30 bg-primary/20 p-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Claude Pro Directory</CardTitle>
                      </div>
                      <UnifiedBadge variant="base" className="border-primary/30">
                        Active
                      </UnifiedBadge>
                    </div>
                    <CardDescription className="text-base">
                      Open-source directory for Claude AI templates and workflows
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className={cn('flex items-center', 'gap-2', 'text-muted-foreground text-sm')}
                    >
                      <Users className="h-4 w-4" />
                      <span>Thousands of monthly visitors</span>
                    </div>
                    <div
                      className={cn('flex items-center', 'gap-2', 'text-muted-foreground text-sm')}
                    >
                      <Award className="h-4 w-4" />
                      <span>Open source & community-driven</span>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href="/" className="inline-flex items-center justify-center gap-1">
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
                <Card className="h-full border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-primary/30 bg-primary/20 p-2">
                          <Network className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Blockchain Validators</CardTitle>
                      </div>
                      <UnifiedBadge variant="base" className="border-primary/30">
                        3+ Years
                      </UnifiedBadge>
                    </div>
                    <CardDescription className="text-base">
                      Cosmos blockchain validator operations and network security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className={cn('flex items-center', 'gap-2', 'text-muted-foreground text-sm')}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>$100MM+ in network assets secured</span>
                    </div>
                    <div
                      className={cn('flex items-center', 'gap-2', 'text-muted-foreground text-sm')}
                    >
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
      <LazySection variant="slide-up" className="bg-muted/30 py-4">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Why Work With Me</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Proven track record of shipping production systems that scale
            </p>
          </motion.div>

          <motion.div
            variants={
              shouldReduceMotion
                ? {
                    hidden: { opacity: 0 },
                    show: { opacity: 1 },
                  }
                : {
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.15,
                        delayChildren: 0.2,
                      },
                    },
                  }
            }
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: Award,
                label: 'Production Systems',
                value: '100%',
                description: 'No demos, only real systems',
              },
              {
                icon: TrendingUp,
                label: 'Assets Secured',
                value: '100',
                suffix: 'MM+',
                description: 'Blockchain infrastructure',
              },
              {
                icon: Users,
                label: 'Monthly Visitors',
                value: '1000',
                suffix: '+',
                description: 'Active projects',
              },
              {
                icon: Sparkles,
                label: 'Open Source',
                value: '1',
                description: 'Community-driven projects',
              },
            ].map((stat, statIndex) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={
                    shouldReduceMotion
                      ? {
                          hidden: { opacity: 0 },
                          show: { opacity: 1 },
                        }
                      : {
                          hidden: { opacity: 0, scale: 0.9 },
                          show: { opacity: 1, scale: 1 },
                        }
                  }
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -4 }}
                  transition={SPRING.smooth}
                  className="border-border/50 bg-card/50 rounded-xl border py-6 text-center backdrop-blur-sm"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-primary/30 bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mb-2 text-3xl font-bold">
                    {stat.value.includes('%') ? (
                      <>
                        <NumberTicker
                          value={parseFloat(stat.value)}
                          delay={statIndex * 150}
                          decimalPlaces={0}
                        />
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
                  <div className="mb-1 text-sm font-semibold">{stat.label}</div>
                  <div className="text-muted-foreground text-xs">{stat.description}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </LazySection>

      {/* CTA Section */}
      <LazySection variant="slide-up" className="bg-background py-4">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={SPRING.smooth}
            className="mx-auto max-w-3xl space-y-6 text-center"
          >
            <div className="space-y-3">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to Build Something Together?</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                I'm accepting new projects now. Book a free 15-minute discovery call below — I'll
                tell you honestly if I'm a good fit or not.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <MagneticButton>
                <Button
                  size="lg"
                  className="px-8 py-6 text-base"
                  onClick={() => {
                    document
                      .getElementById('calendar-section')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Book Your Free Call
                </Button>
              </MagneticButton>
              <Button
                variant="outline"
                size="lg"
                className={cn('text-base', 'px-8', 'py-6')}
                asChild
              >
                <a href="mailto:ghost@zeronode.sh" className="inline-flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email Me Instead
                </a>
              </Button>
            </div>

            <div className={cn('pt-8', 'space-y-2', 'text-muted-foreground text-sm')}>
              <p>✓ 15-minute discovery call (free)</p>
              <p>✓ Honest assessment of fit</p>
              <p>✓ No pressure, no commitment</p>
            </div>
          </motion.div>
        </div>
      </LazySection>

      {/* Calendar Section */}
      <div id="calendar-section">
        <LazySection variant="slide-up" className="bg-muted/30 py-4">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={SPRING.smooth}
              className="mx-auto max-w-4xl"
            >
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                  Book Your Free Discovery Call
                </h2>
                <p className="text-muted-foreground text-lg">
                  Choose a time that works for you. I'll send a calendar invite with a video call
                  link.
                </p>
              </div>

              {/* Compact Calendar Container */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={SPRING.smooth}
                className="relative"
              >
                <Card className="border-border/50 bg-card/50 overflow-hidden border-2 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="relative max-h-[800px] min-h-[600px]">
                      {calReady ? (
                        <Cal
                          calLink="jsonbored/heyclaude-consult"
                          config={{
                            theme: 'dark',
                            layout: 'month_view',
                          }}
                          className="h-full max-h-[800px] min-h-[600px] w-full overflow-hidden"
                        />
                      ) : (
                        <div className="flex-center h-[600px]">
                          <div className="space-y-3 text-center">
                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
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
                className="text-muted-foreground mt-8 text-center text-sm"
              >
                <p>
                  Prefer email?{' '}
                  <a
                    href="mailto:ghost@zeronode.sh"
                    className={`text-primary underline underline-offset-4 transition-colors hover:text-primary/80`}
                  >
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
