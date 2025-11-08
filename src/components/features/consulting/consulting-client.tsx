'use client';

/**
 * Consulting Page Client Component - Cal.com integration and animations
 */

import { getCalApi } from '@calcom/embed-react';
import { motion, type Variants } from 'motion/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { AnimatedSpan, Terminal, TypingAnimation } from '@/src/components/ui/shadcn-io/terminal';
import { Calendar, Code, Database, Mail, Sparkles, Workflow, Zap } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export function ConsultingClient() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: 'consulting-call' });
      cal('ui', {
        theme: 'dark',
        styles: { branding: { brandColor: 'hsl(var(--accent))' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })().catch((error: Error) => {
      logger.error(
        'Failed to initialize Cal.com',
        error instanceof Error ? error : new Error(String(error)),
        { namespace: 'consulting-call' }
      );
    });
  }, []);

  const openCalModal = () => {
    // @ts-expect-error - Cal.com global API
    window.Cal?.('consulting-call')?.('openModal', {
      calLink: 'jsonbored/heyclaude-consult',
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Hero Section */}
      <motion.div className="mb-16" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          <h1 className="mb-6 font-bold text-4xl md:text-5xl">
            I Build Database-First Systems That Ship Fast
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <Terminal className="mx-auto max-w-2xl">
            <AnimatedSpan delay={0}>
              <span className="text-green-500">ghost@zeronode</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-blue-500">~</span>
              <span className="text-muted-foreground">$</span>{' '}
              <TypingAnimation delay={200} duration={50}>
                whoami
              </TypingAnimation>
            </AnimatedSpan>

            <AnimatedSpan delay={1200}>
              <span className="text-muted-foreground">
                JSONbored - Database-First Architecture Specialist
              </span>
            </AnimatedSpan>

            <AnimatedSpan delay={1400}>
              <span className="text-muted-foreground">
                Creator of ClaudePro Directory (10k+ monthly pageviews)
              </span>
            </AnimatedSpan>

            <AnimatedSpan delay={1800}>
              <span className="text-green-500">ghost@zeronode</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-blue-500">~</span>
              <span className="text-muted-foreground">$</span>{' '}
              <TypingAnimation delay={2000} duration={50}>
                cat experience.txt
              </TypingAnimation>
            </AnimatedSpan>

            <AnimatedSpan delay={3200}>
              <span className="text-yellow-500">→</span>{' '}
              <span className="text-muted-foreground">
                Blockchain infra engineer (3+ yrs Cosmos validator, $100MM+ secured)
              </span>
            </AnimatedSpan>

            <AnimatedSpan delay={3400}>
              <span className="text-yellow-500">→</span>{' '}
              <span className="text-muted-foreground">
                Database-first architect (PostgreSQL, blazing-fast queries, clean code)
              </span>
            </AnimatedSpan>

            <AnimatedSpan delay={3600}>
              <span className="text-yellow-500">→</span>{' '}
              <span className="text-muted-foreground">
                AI/LLM engineer (Claude Code, prompt engineering, agent systems)
              </span>
            </AnimatedSpan>

            <AnimatedSpan delay={3800}>
              <span className="text-yellow-500">→</span>{' '}
              <span className="text-muted-foreground">
                Full-stack generalist (DevOps, SysAdmin, UX/UI, marketing)
              </span>
            </AnimatedSpan>

            <AnimatedSpan delay={4200}>
              <span className="text-green-500">ghost@zeronode</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-blue-500">~</span>
              <span className="text-muted-foreground">$</span>{' '}
              <TypingAnimation delay={4400} duration={50}>
                echo $TECH_STACK
              </TypingAnimation>
            </AnimatedSpan>

            <AnimatedSpan delay={5600}>
              <span className="text-cyan-500">Next.js 15 • React 19 • TypeScript</span>
            </AnimatedSpan>

            <AnimatedSpan delay={5800}>
              <span className="text-cyan-500">PostgreSQL • Supabase • Cloudflare Workers</span>
            </AnimatedSpan>

            <AnimatedSpan delay={6000}>
              <span className="text-cyan-500">Claude Code • LangGraph • CrewAI</span>
            </AnimatedSpan>

            <AnimatedSpan delay={6400}>
              <span className="text-green-500">ghost@zeronode</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-blue-500">~</span>
              <span className="text-muted-foreground">$</span>{' '}
              <span className="animate-pulse">▊</span>
            </AnimatedSpan>
          </Terminal>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center text-lg text-muted-foreground">
          <p>
            I build blazing-fast, scalable systems with clean architecture. PostgreSQL does the
            heavy lifting, TypeScript stays thin, and everything ships faster.
          </p>
        </motion.div>
      </motion.div>

      {/* What I Do */}
      <motion.section
        className="mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        <motion.h2 variants={itemVariants} className="mb-8 font-bold text-3xl">
          What I Do
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Database-First Architecture */}
          <motion.div
            variants={itemVariants}
            whileHover={{
              y: -2,
              transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }}
            className="rounded-lg border border-border p-6 transition-colors hover:border-accent/50"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-xl">Database-First Architecture</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• PostgreSQL RPC functions, materialized views, triggers</li>
              <li>• Blazing-fast queries with proper indexing strategies</li>
              <li>• Business logic in the database, TypeScript stays thin</li>
              <li>• Clean, maintainable data structures</li>
            </ul>
          </motion.div>

          {/* Blockchain Infrastructure */}
          <motion.div
            variants={itemVariants}
            whileHover={{
              y: -2,
              transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }}
            className="rounded-lg border border-border p-6 transition-colors hover:border-accent/50"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Workflow className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="font-semibold text-xl">Blockchain Infrastructure</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• 3+ years running Cosmos validators ($100MM+ secured)</li>
              <li>• DevOps, monitoring, high-availability systems</li>
              <li>• Smart contracts, Web3 APIs, wallet integrations</li>
              <li>• Network administration and security hardening</li>
            </ul>
          </motion.div>

          {/* AI & Automation */}
          <motion.div
            variants={itemVariants}
            whileHover={{
              y: -2,
              transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }}
            className="rounded-lg border border-border p-6 transition-colors hover:border-accent/50"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-xl">AI & LLM Systems</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Claude Code agent architecture and custom MCP servers</li>
              <li>• Production LLM systems (LangGraph, CrewAI, AutoGen)</li>
              <li>• Prompt engineering and AI workflow orchestration</li>
              <li>• Vector search, semantic systems, RAG pipelines</li>
            </ul>
          </motion.div>

          {/* Full-Stack & DevOps */}
          <motion.div
            variants={itemVariants}
            whileHover={{
              y: -2,
              transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }}
            className="rounded-lg border border-border p-6 transition-colors hover:border-accent/50"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Code className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-semibold text-xl">Full-Stack & DevOps</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Modern web stack (Next.js 15, React 19, TypeScript)</li>
              <li>• UX/UI design, TailwindCSS v4, shadcn/ui components</li>
              <li>• DevOps, CI/CD, monitoring, infrastructure as code</li>
              <li>• Digital marketing, SEO, analytics, conversion optimization</li>
            </ul>
          </motion.div>
        </div>
      </motion.section>

      {/* How I Work */}
      <motion.section
        className="mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        <motion.h2 variants={itemVariants} className="mb-8 font-bold text-3xl">
          How I Work
        </motion.h2>

        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-border bg-card/50 p-8"
        >
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
                1
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-lg">Discovery Call (30 min, free)</h3>
                <p className="text-muted-foreground">
                  We discuss your project, technical challenges, and goals. I'll tell you honestly
                  if I'm a good fit or not.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
                2
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-lg">Proposal & Timeline</h3>
                <p className="text-muted-foreground">
                  I'll send a detailed proposal with scope, timeline (usually 2-4 week sprints), and
                  fixed pricing. No surprises.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
                3
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-lg">Build & Ship</h3>
                <p className="text-muted-foreground">
                  I work in focused sprints with daily updates. You get production-ready code,
                  documentation, and knowledge transfer.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <p className="font-medium text-sm">
              <Zap className="mr-2 inline h-4 w-4 text-accent" />
              Typical engagement: 2-4 week sprint focused on shipping production systems
            </p>
          </div>
        </motion.div>
      </motion.section>

      {/* Recent Work */}
      <motion.section
        className="mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        <motion.h2 variants={itemVariants} className="mb-6 font-bold text-3xl">
          Recent Work
        </motion.h2>
        <motion.div
          variants={itemVariants}
          className="space-y-4 border-l-4 border-l-accent pl-6 text-muted-foreground"
        >
          <p>
            • Built <strong>ClaudePro Directory</strong>: Claude Code resource library with clean
            architecture and 10k+ monthly pageviews
          </p>
          <p>
            • Ran a high-end <strong>Cosmos validator team</strong> for 3+ years, securing $100MM+
            in network assets
          </p>
          <p>
            • Designed blazing-fast database-first systems with PostgreSQL RPC functions,
            materialized views, and optimal indexing
          </p>
          <p>
            • Shipped production AI agent systems with Claude Code, custom MCP servers, and LLM
            orchestration frameworks
          </p>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-accent/30 bg-accent/5 p-8 text-center"
        >
          <h2 className="mb-4 font-semibold text-2xl">Ready to Build Something?</h2>
          <p className="mb-8 text-muted-foreground">
            I'm accepting new projects for <strong>Q1 2026</strong>. Book a free 30-minute call or
            send me an email.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
              }}
            >
              <button
                type="button"
                onClick={openCalModal}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <Calendar className="h-4 w-4" />
                Book a Call
              </button>
            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
              }}
              whileTap={{
                scale: 0.98,
                transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
              }}
            >
              <Link
                href="mailto:ghost@zeronode.sh"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 transition-colors hover:border-accent/50"
              >
                <Mail className="h-4 w-4" />
                Email Me
              </Link>
            </motion.div>
          </div>

          <p className="mt-6 text-muted-foreground text-sm">
            I respond within 24 hours. No sales pitch—just an honest conversation about your
            project.
          </p>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.div
        className="mt-8 text-center text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <p>
          Want to see my work?{' '}
          <Link href="https://github.com/jsonbored" className="link-accent-underline">
            Check out my GitHub
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
