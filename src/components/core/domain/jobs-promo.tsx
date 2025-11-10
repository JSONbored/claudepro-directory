/**
 * JobsPromo - Sticky sidebar promotion for job board listings
 */

import Link from 'next/link';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent } from '@/src/components/primitives/card';
import { Check, TrendingUp } from '@/src/lib/icons';

export function JobsPromo() {
  return (
    <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 to-background">
      <CardContent className="space-y-4 p-6">
        {/* Hook with honest growth story */}
        <div>
          <h3 className="mb-2 font-bold text-xl leading-tight">Hire Claude Developers</h3>
          <p className="text-muted-foreground text-sm">
            Growing community of AI engineers actively building with Claude
          </p>
        </div>

        {/* Real growth metrics (honest but positive) */}
        <div className="space-y-2 rounded-lg border bg-background/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active community</span>
            <span className="font-semibold">1,700/month</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Growth rate</span>
            <span className="flex items-center gap-1 font-semibold text-green-500">
              <TrendingUp className="h-3 w-3" />
              Month 2
            </span>
          </div>
        </div>

        {/* Value props (factual, not fake) */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <span className="text-sm">Specialized AI talent pool</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <span className="text-sm">30-day featured visibility</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <span className="text-sm">Early-stage pricing advantage</span>
          </div>
        </div>

        {/* CTA */}
        <Button asChild className="w-full">
          <Link href="/jobs">View Pricing & Post Job</Link>
        </Button>

        {/* Soft trust signal */}
        <p className="text-center text-muted-foreground text-xs">
          Live in 5 minutes ? Growing community
        </p>
      </CardContent>
    </Card>
  );
}
