
/*
 * AI Copy Assistant
 * 
 * @author Filippo Danesi
 * @email filippo.danesi93@gmail.com
 * @website https://www.filippodanesi.com
 * @created 2025
 * @copyright Copyright (c) 2025 Filippo Danesi. All rights reserved.
 * 
 * This file is part of AI Copy Assistant.
 * 
 * This software is dual-licensed:
 * - For non-commercial use: CC BY-NC-SA 4.0
 * - For commercial use: Commercial license required
 * 
 * See LICENSE file for complete terms.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Changelog from "./pages/Changelog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/changelog" element={<Changelog />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
