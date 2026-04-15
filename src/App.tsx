
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

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ApiKeysProvider } from "./contexts/ApiKeysContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Changelog = lazy(() => import("./pages/Changelog"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ApiKeysProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/changelog" element={<ProtectedRoute><Changelog /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </ApiKeysProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
