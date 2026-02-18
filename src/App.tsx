
/*
 * VisionDescribe
 * 
 * @author Filippo Danesi
 * @email filippo.danesi93@gmail.com
 * @website https://www.filippodanesi.com
 * @created 2025
 * @copyright Copyright (c) 2025 Filippo Danesi. All rights reserved.
 * 
 * This file is part of VisionDescribe.
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
import { AuthProvider } from "./contexts/AuthContext";
import { ApiKeysProvider } from "./contexts/ApiKeysContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Changelog from "./pages/Changelog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ApiKeysProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/changelog" element={<ProtectedRoute><Changelog /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ApiKeysProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
