/**
 * JobsPromo - Sticky sidebar promotion for job board listings
 */

import Link from 'next/link';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { Briefcase, Star, TrendingUp } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function JobsPromo() {
  return (
    <Card className={UI_CLASSES.CARD_GRADIENT_HOVER}>
      <CardHeader className={UI_CLASSES.CARD_HEADER_DEFAULT}>
        <CardTitle className={`${UI_CLASSES.TEXT_CARD_TITLE} flex items-center gap-2`}>
          <Briefcase className={UI_CLASSES.ICON_SM} />
          Post a Job Listing
        </CardTitle>
      </CardHeader>
      <CardContent className={UI_CLASSES.CARD_CONTENT_DEFAULT}>
        <p className={`${UI_CLASSES.TEXT_CARD_DESCRIPTION} ${UI_CLASSES.MARGIN_DEFAULT}`}>
          Reach 10,000+ Claude AI developers, engineers, and technical decision-makers.
        </p>

        <div className={`${UI_CLASSES.SPACE_COMPACT} ${UI_CLASSES.MARGIN_DEFAULT}`}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <TrendingUp className={`${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
            <span className={UI_CLASSES.TEXT_METADATA}>30 days active visibility</span>
          </div>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Star className={`${UI_CLASSES.ICON_SM} text-orange-500`} />
            <span className={UI_CLASSES.TEXT_METADATA}>Featured listings available</span>
          </div>
        </div>

        <div className={`${UI_CLASSES.SPACE_COMPACT} ${UI_CLASSES.MARGIN_DEFAULT}`}>
          <p className={`${UI_CLASSES.TEXT_SM_MUTED}`}>
            <span className="font-semibold text-foreground">$79</span> one-time
          </p>
          <p className={`${UI_CLASSES.TEXT_SM_MUTED}`}>
            <span className="font-semibold text-foreground">$59/month</span> subscription
          </p>
          <p className={UI_CLASSES.TEXT_XS_MUTED}>First 50 subscribers: lifetime rate lock</p>
        </div>

        <Button asChild className="w-full">
          <Link href="/account/jobs/new">Post Your Job</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
