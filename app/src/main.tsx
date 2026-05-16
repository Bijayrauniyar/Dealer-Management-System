import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { AppRouter } from "@/routes/AppRouter";
import { AuthProvider } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { MissingSupabaseEnv } from "@/components/MissingSupabaseEnv";
import "./index.css";

const root = (
  <QueryClientProvider client={queryClient}>
    <AppRouter />
    <Toaster richColors position="top-center" />
  </QueryClientProvider>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isSupabaseConfigured ? <AuthProvider>{root}</AuthProvider> : <MissingSupabaseEnv />}
  </React.StrictMode>,
);
