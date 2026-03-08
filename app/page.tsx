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
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const [sidebarKey, setSidebarKey] = useState(0);

  // 1. Check Auth State
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

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
    setAnalysis(null);
  };

  // 3. Search Logic
  const handleSearch = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q) return;

    setAnalysis(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productQuery: q }),
      });

      if (!res.ok) throw new Error("Search failed.");
      const data = await res.json();
      setAnalysis(data);

      if (user) {
        // ALIGNED: Only inserting columns defined in search_history schema
        const { error: saveError } = await supabase.from("search_history").insert([
          {
            user_id: user.id,
            product_name: data.main_product.name,
            result: data
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
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar
        key={sidebarKey}
        onSelectHistory={(historicalData: any) => {
          setAnalysis(historicalData.result);
        }}
      />

      <main className="flex-1 overflow-y-auto relative p-6">
        {/* Auth Header */}
        <div className="absolute top-6 right-6 z-20">
          {user ? (
            <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full shadow-sm border border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-zinc-700">{user.email}</span>
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
        </div>

        <div className="max-w-4xl mx-auto pt-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4 italic">
              Suits Me Right
            </h1>
            <p className="text-zinc-500 text-lg max-w-lg mx-auto">
              AI-Powered Product Audits for the Conscious Consumer.
            </p>
          </div>

          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={() => handleSearch()}
            isLoading={isAnalyzing}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <div className="mt-12">
            {analysis ? (
              <AnalysisResults analysis={analysis} user={user} />
            ) : (
              !isAnalyzing && (
                <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-3xl">
                  <p className="text-zinc-400 font-medium">Search for a product to begin your AI audit.</p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}