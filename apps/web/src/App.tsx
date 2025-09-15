import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import Rules from "./pages/Rules";
import McpServers from "./pages/McpServers";
import Jobs from "./pages/Jobs";
import Job from "./pages/Job";
import Trending from "./pages/Trending";
import Community from "./pages/Community";
import Submit from "./pages/Submit";
import Rule from "./pages/Rule";
import McpServer from "./pages/McpServer";
import NotFound from "./pages/NotFound";
import Agents from "./pages/Agents";
import Agent from "./pages/Agent";
import Commands from "./pages/Commands";
import Command from "./pages/Command";
import Hooks from "./pages/Hooks";
import Hook from "./pages/Hook";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/rule/:slug" element={<Rule />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
