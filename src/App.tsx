import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/navigation";
import { Analytics } from "@vercel/analytics/react";

// Lazy load all route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Rules = lazy(() => import("./pages/Rules"));
const McpServers = lazy(() => import("./pages/McpServers"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Job = lazy(() => import("./pages/Job"));
const Trending = lazy(() => import("./pages/Trending"));
const Community = lazy(() => import("./pages/Community"));
const Submit = lazy(() => import("./pages/Submit"));
const Rule = lazy(() => import("./pages/Rule"));
const McpServer = lazy(() => import("./pages/McpServer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Agents = lazy(() => import("./pages/Agents"));
const Agent = lazy(() => import("./pages/Agent"));
const Commands = lazy(() => import("./pages/Commands"));
const Command = lazy(() => import("./pages/Command"));
const Hooks = lazy(() => import("./pages/Hooks"));
const Hook = lazy(() => import("./pages/Hook"));
const Author = lazy(() => import("./pages/Author"));

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
      <BrowserRouter>
        <Navigation />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/rules/:slug" element={<Rule />} />
          <Route path="/mcp" element={<McpServers />} />
          <Route path="/mcp/:slug" element={<McpServer />} />
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
