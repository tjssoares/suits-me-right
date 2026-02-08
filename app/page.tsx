"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LogIn, LogOut, User } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import AnalysisResults from "@/components/AnalysisResults";

export default function HomePage() {
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarKey, setSidebarKey] = useState(0);

  // 1. Check Auth State
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // 2. Handle Login/Logout
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAnalysis(null); // Optional: Clear screen on logout
  };

  // 3. Search Logic
  const handleSearch = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q) return;

    setAnalysis(null); // Clear previous result
    setError(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productQuery: q, userId: user?.id }),
      });

      if (!res.ok) throw new Error("Search failed.");
      const data = await res.json();
      setAnalysis(data);

      if (user) {
        const { error: saveError } = await supabase.from("search_history").insert([
          {
            user_id: user.id,
            product_name: data.main_product.name,
            analysis_summary: data.main_product.public_summary,
            durability_score: data.main_product.durability || 0,
            result: data,
            metadata: { timestamp: new Date().toISOString() }
          }
        ]);
        if (!saveError) setSidebarKey(prev => prev + 1);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Sidebar handles history selection */}
      <Sidebar 
        key={sidebarKey} 
        onSelectHistory={(historicalData: any) => {
          // KEY FIX: This just sets the state. It does NOT call the API.
          // This ensures ZERO tokens are used when viewing history.
          setAnalysis(historicalData.result);
        }} 
      />

      <main className="flex-1 flex flex-col h-full relative">
        {/* HEADER: Login Button Top Right */}
        <header className="absolute top-0 right-0 p-6 z-10 flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-2 pl-4 rounded-full shadow-sm border border-zinc-200">
              <span className="text-sm font-medium text-zinc-600 hidden sm:block">
                {user.email}
              </span>
              <button 
                onClick={handleSignOut}
                className="bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition text-zinc-600"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-zinc-800 transition shadow-lg hover:shadow-xl"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto px-6 py-12 mt-12">
            
            {/* LOGO & SEARCH */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-black tracking-tighter mb-4 italic uppercase text-zinc-800">
                Suits Me Right
              </h1>
              <SearchBar 
                query={query} 
                setQuery={setQuery} 
                onSearch={() => handleSearch()} 
                isLoading={isAnalyzing} 
              />
            </div>

            {error && (
              <p className="text-red-500 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                {error}
              </p>
            )}

            {/* RESULTS AREA */}
            {analysis ? (
              <AnalysisResults analysis={analysis} user={user} />
            ) : (
              !isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-zinc-400 font-medium">
                    Search for a product to begin your AI audit.
                  </p>
                </div>
              )
            )}

            {/* LOADING SKELETON */}
            {isAnalyzing && (
              <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
                <div className="h-64 bg-zinc-200 rounded-3xl w-full" />
                <div className="h-40 bg-zinc-200 rounded-3xl w-full" />
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-48 bg-zinc-200 rounded-2xl" />
                   <div className="h-48 bg-zinc-200 rounded-2xl" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}