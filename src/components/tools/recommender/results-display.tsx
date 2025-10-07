'use client';

/**
 * Results Display Component
 * Displays personalized configuration recommendations
 *
 * Features:
 * - Ranked recommendation cards
 * - Match score visualization
 * - Filter/sort capabilities
 * - Share results functionality
 * - Responsive grid layout
 */

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { ArrowRight, BarChart, RefreshCw, Share2, Sparkles, TrendingUp } from '@/src/lib/icons';
import type { RecommendationResponse } from '@/src/lib/schemas/recommender.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { RecommendationCard } from './recommendation-card';
import { ShareResults } from './share-results';

interface ResultsDisplayProps {
  recommendations: RecommendationResponse;
  shareUrl: string;
}

export function ResultsDisplay({ recommendations, shareUrl }: ResultsDisplayProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { results, summary, totalMatches, answers } = recommendations;

  // Filter results by category
  const filteredResults =
    selectedCategory === 'all' ? results : results.filter((r) => r.category === selectedCategory);

  // Get unique categories from results
  const categories = ['all', ...new Set(results.map((r) => r.category))];

  return (
    <div className={UI_CLASSES.SPACE_Y_8}>
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">Your Personalized Recommendations</h1>
        </div>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Based on your preferences, we found{' '}
          <strong>{totalMatches} matching configurations</strong>. Here are the top {results.length}{' '}
          best fits for your needs.
        </p>

        {/* Summary Stats */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge variant="secondary" className="text-sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            {summary.avgMatchScore}% Avg Match
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <BarChart className="h-3 w-3 mr-1" />
            {summary.diversityScore}% Diversity
          </Badge>
          <Badge variant="outline" className="text-sm">
            Top Category: {summary.topCategory}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools/config-recommender" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Start Over
            </Link>
          </Button>
        </div>
      </div>

      {/* Your Selections Summary */}
      <Card className="bg-accent/5">
        <CardHeader>
          <CardTitle className="text-lg">Your Selections</CardTitle>
          <CardDescription>We matched configurations based on these preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <span className="text-sm font-medium">Use Case</span>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {answers.useCase.replace('-', ' ')}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Experience Level</span>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {answers.experienceLevel}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Tool Preferences</span>
              <p className="text-sm text-muted-foreground mt-1">
                {answers.toolPreferences.join(', ')}
              </p>
            </div>
            {answers.integrations && answers.integrations.length > 0 && (
              <div>
                <span className="text-sm font-medium">Integrations</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {answers.integrations.join(', ')}
                </p>
              </div>
            )}
            {answers.focusAreas && answers.focusAreas.length > 0 && (
              <div>
                <span className="text-sm font-medium">Focus Areas</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {answers.focusAreas.join(', ')}
                </p>
              </div>
            )}
            {answers.teamSize && (
              <div>
                <span className="text-sm font-medium">Team Size</span>
                <p className="text-sm text-muted-foreground mt-1 capitalize">{answers.teamSize}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto">
          {categories.map((category) => {
            const count =
              category === 'all'
                ? results.length
                : results.filter((r) => r.category === category).length;
            return (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === 'all' ? 'All Results' : category} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Results Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((result) => (
              <RecommendationCard key={result.slug} result={result} />
            ))}
          </div>

          {filteredResults.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No results in this category</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Next Steps CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to start using these configurations? Click any card to view detailed setup
            instructions, examples, and documentation.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/" className="gap-2">
                Browse All Configs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/guides">View Setup Guides</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      {showShareModal && (
        <ShareResults
          shareUrl={shareUrl}
          resultCount={results.length}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
