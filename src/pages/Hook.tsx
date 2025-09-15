import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CodeHighlight } from '@/components/CodeHighlight';
import { RelatedConfigs } from '@/components/RelatedConfigs';
import { 
  ArrowLeft, 
  Webhook, 
  Calendar, 
  User, 
  Tag, 
  Star, 
  Zap,
  Settings,
  FileText,
  Play,
  AlertTriangle
} from 'lucide-react';
import { getHookBySlug, hooks } from '@/data/hooks';
import NotFound from './NotFound';

const Hook = () => {
  const { slug } = useParams<{ slug: string }>();
  
  if (!slug) {
    return <NotFound />;
  }

  const hook = getHookBySlug(slug);
  
  if (!hook) {
    return <NotFound />;
  }

  const relatedHooks = hooks
    .filter(h => h.id !== hook.id && h.category === hook.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/hooks" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Hooks
            </Link>
          </Button>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Webhook className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{hook.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{hook.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">{hook.category}</Badge>
                {hook.featured && (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {hook.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {hook.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(hook.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Popularity: {hook.popularity}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: hook.content.replace(/\n/g, '<br>') }} />
                </div>
              </CardContent>
            </Card>

            {/* Trigger Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Trigger Events
                </CardTitle>
                <CardDescription>
                  Events that can trigger this hook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {hook.triggerEvents.map((event, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <code className="text-sm">{event}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Actions
                </CardTitle>
                <CardDescription>
                  Actions performed when the hook is triggered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hook.actions.map((action, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{action.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {action.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                      {action.parameters && (
                        <div className="mt-2">
                          <CodeHighlight
                            code={JSON.stringify(action.parameters, null, 2)}
                            language="json"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Required and optional configuration parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hook.configuration.map((config, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {config.key}
                        </code>
                        <Badge variant={config.required ? 'destructive' : 'secondary'} className="text-xs">
                          {config.required ? 'Required' : 'Optional'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {config.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                      {config.default !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Default: <code className="bg-muted px-1 rounded">{String(config.default)}</code>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platforms */}
            {hook.platforms && hook.platforms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Supported Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hook.platforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {hook.requirements && hook.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hook.requirements.map((req, index) => (
                      <div key={index} className="text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        {req}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  Copy Hook Configuration
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/submit">
                    Submit Improvement
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Hooks */}
        {relatedHooks.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-8" />
            <RelatedConfigs
              title="Related Hooks"
              configs={relatedHooks}
              type="hook"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Hook;