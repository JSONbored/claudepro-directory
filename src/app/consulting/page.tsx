/**
 * Consulting Page
 * Professional services page for engineering consulting
 *
 * @module app/consulting
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Briefcase, Code, Database, Sparkles, Workflow, Zap } from '@/src/lib/icons';

export const metadata: Metadata = {
  title: 'Engineering Consulting | Work with JSONbored',
  description:
    'Expert consulting for AI agent architecture, Web3 infrastructure, and modern web development. Production-ready solutions from the creator of ClaudePro Directory.',
  openGraph: {
    title: 'Engineering Consulting | Work with JSONbored',
    description:
      'Expert consulting for AI agent architecture, Web3 infrastructure, and modern web development.',
  },
};

export default function ConsultingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Engineering Consulting</h1>
        <p className="text-xl text-muted-foreground">
          I'm{' '}
          <Link href="https://github.com/jsonbored" className="link-accent-underline">
            JSONbored
          </Link>
          , the creator of ClaudePro Directory. I help companies ship production-ready AI systems,
          Web3 infrastructure, and modern web applications.
        </p>
      </div>

      {/* What I Do */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8">What I Do</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* AI & Automation */}
          <div className="border border-border rounded-lg p-6 hover:border-accent/50 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI & Automation</h3>
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className="mb-3 border-accent/20 bg-accent/5 text-accent"
                >
                  Claude Code Expert
                </UnifiedBadge>
              </div>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Claude Code agent architecture and implementation</li>
              <li>• Custom MCP server development</li>
              <li>• AI workflow orchestration (LangGraph, CrewAI, AutoGen)</li>
              <li>• Production LLM system design</li>
            </ul>
          </div>

          {/* Infrastructure & DevOps */}
          <div className="border border-border rounded-lg p-6 hover:border-accent/50 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Infrastructure & DevOps</h3>
                <UnifiedBadge variant="base" style="outline" className="mb-3">
                  Web3 Specialist
                </UnifiedBadge>
              </div>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Web3 validator nodes and blockchain infrastructure</li>
              <li>• Cloud architecture (AWS, GCP, Cloudflare Workers)</li>
              <li>• CI/CD pipeline design and automation</li>
              <li>• Kubernetes orchestration and scaling</li>
            </ul>
          </div>

          {/* Full-Stack Development */}
          <div className="border border-border rounded-lg p-6 hover:border-accent/50 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Code className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Full-Stack Development</h3>
                <UnifiedBadge variant="base" style="outline" className="mb-3">
                  Modern Stack
                </UnifiedBadge>
              </div>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Modern web apps (Next.js, React, TypeScript)</li>
              <li>• API design and implementation (REST, GraphQL, tRPC)</li>
              <li>• Database architecture (PostgreSQL, D1, Redis)</li>
              <li>• Real-time systems (WebSockets, Server-Sent Events)</li>
            </ul>
          </div>

          {/* Process */}
          <div className="border border-border rounded-lg p-6 hover:border-accent/50 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Workflow className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">How I Work</h3>
                <UnifiedBadge variant="base" style="outline" className="mb-3">
                  Flexible Engagements
                </UnifiedBadge>
              </div>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong>Consulting:</strong> Architecture reviews, technical advisory, code audits
              </li>
              <li>
                <strong>Implementation:</strong> Build systems from scratch or integrate into
                existing codebases
              </li>
              <li>
                <strong>Training:</strong> Team workshops on AI agents, infrastructure, or modern
                web dev
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Recent Work */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Recent Work</h2>
        <div className="border-l-4 border-l-accent pl-6 space-y-4 text-muted-foreground">
          <p>
            • Built <strong>ClaudePro Directory</strong>: Largest Claude Code resource library with
            100,000+ monthly visits
          </p>
          <p>
            • Designed production agent systems handling <strong>1M+ operations/month</strong> with
            67% productivity gains
          </p>
          <p>
            • Architected Web3 infrastructure running validator nodes with significant staked assets
          </p>
          <p>
            • Implemented AI automation workflows reducing team workload by{' '}
            <strong>40-60 hours/week</strong>
          </p>
        </div>
      </section>

      {/* Best For */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Let's Talk</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Good Fit */}
          <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Best For
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✅ Teams adopting Claude Code for production workflows</li>
              <li>✅ Companies building AI-first products</li>
              <li>✅ Web3 projects needing infrastructure expertise</li>
              <li>✅ Startups needing a senior generalist who ships fast</li>
            </ul>
          </div>

          {/* Not a Fit */}
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              Not a Fit
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>❌ Ongoing maintenance work (I design systems, not babysit them)</li>
              <li>❌ Projects without clear technical ownership</li>
              <li>❌ Agencies looking to resell my work</li>
              <li>❌ Non-technical founders wanting someone to "just build it"</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="border border-accent/30 bg-accent/5 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-semibold mb-4">Ready to Work Together?</h3>
          <p className="text-muted-foreground mb-6">
            Typical engagement: <strong>2-4 week sprints</strong> focused on shipping production
            systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="mailto:contact@heyclau.de"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Email Me
            </Link>
            <Link
              href="https://github.com/jsonbored"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:border-accent/50 transition-colors"
            >
              View GitHub
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            I'll respond within 24 hours. We'll schedule a 30-minute intro call to discuss fit and
            scope.
          </p>
        </div>
      </section>

      {/* Footer Note */}
      <div className="text-center text-sm text-muted-foreground border-t border-border pt-8">
        <p>
          Currently accepting projects for <strong>Q1 2026</strong>. Limited availability.
        </p>
      </div>
    </div>
  );
}
