import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { FocusIndicator } from '@/components/focus-indicator';
import { Navigation } from '@/components/navigation';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Lazy load all route components for code splitting
const Index = lazy(() => import('./pages/index'));
const Rules = lazy(() => import('./pages/rules'));
const Mcp = lazy(() => import('./pages/mcp'));
const Jobs = lazy(() => import('./pages/jobs'));
const Job = lazy(() => import('./pages/job'));
const Trending = lazy(() => import('./pages/trending'));
const Community = lazy(() => import('./pages/community'));
const Submit = lazy(() => import('./pages/submit'));
const Rule = lazy(() => import('./pages/rule'));
const McpItem = lazy(() => import('./pages/mcp-item'));
const NotFound = lazy(() => import('./pages/not-found'));
const Agents = lazy(() => import('./pages/agents'));
const Agent = lazy(() => import('./pages/agent'));
const Commands = lazy(() => import('./pages/commands'));
const Command = lazy(() => import('./pages/command'));
const Hooks = lazy(() => import('./pages/hooks'));
const Hook = lazy(() => import('./pages/hook'));
const Author = lazy(() => import('./pages/author'));

const queryClient = new QueryClient();

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FocusIndicator />
      <BrowserRouter>
        <Navigation />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/rules/:slug" element={<Rule />} />
            <Route path="/mcp" element={<Mcp />} />
            <Route path="/mcp/:slug" element={<McpItem />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:slug" element={<Agent />} />
            <Route path="/commands" element={<Commands />} />
            <Route path="/commands/:slug" element={<Command />} />
            <Route path="/hooks" element={<Hooks />} />
            <Route path="/hooks/:slug" element={<Hook />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:slug" element={<Job />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/community" element={<Community />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/author/:username" element={<Author />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
