import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Copy, Check, Calendar, User, TrendingUp, ExternalLink, Github } from 'lucide-react';
import { getRuleBySlug, rules } from '@/data/rules';
import { mcpServers } from '@/data/mcp';
import { CodeHighlight } from '@/components/CodeHighlight';
import { RelatedConfigs } from '@/components/RelatedConfigs';
import { getRelatedConfigs } from '@/lib/recommendations';
import { toast } from '@/hooks/use-toast';

const Rule = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const rule = slug ? getRuleBySlug(slug) : null;
  const relatedConfigs = rule ? getRelatedConfigs(rule, rules, mcpServers, 4) : [];

  if (!rule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Rule Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested Claude rule could not be found.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(rule.content);
      setCopied(true);
      toast({
        title: "Content copied!",
        description: "The rule content has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "The rule link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      writing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      analysis: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      creative: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      business: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={getCategoryColor(rule.category)}>
                {rule.category}
              </Badge>
              <Badge variant="outline">Claude Rule</Badge>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              {rule.name}
            </h1>

            <p className="text-lg text-muted-foreground">
              {rule.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{rule.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(rule.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{rule.popularity}% popularity</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {rule.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button onClick={handleCopyContent} className="flex items-center gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Content
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Share Link
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open(`https://github.com/JSONbored/claudepro-directory/blob/main/src/data/rules/${rule.slug}.ts`, '_blank')}
          >
            <Github className="h-4 w-4 mr-2" />
            Repository
          </Button>
        </div>

        {/* Content */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rule Content</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyContent}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </CardTitle>
            <CardDescription>
              Copy this content to use as your Claude system prompt or .claudeconfig file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeHighlight
              code={rule.content}
              language="text"
              title="Claude Rule Configuration"
              showCopy={true}
            />
          </CardContent>
        </Card>

        {/* Related Configurations */}
        {relatedConfigs.length > 0 && (
          <div className="mb-8">
            <RelatedConfigs configs={relatedConfigs} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Found this rule helpful?{' '}
              <button 
                onClick={handleCopyLink}
                className="text-primary hover:underline"
              >
                Share it with others
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rule;