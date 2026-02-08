"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import AnalysisResults from "@/components/AnalysisResults";

export default function HomePage() {
  // Updated Supabase Client Initialization
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

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
      <Sidebar 
        key={sidebarKey} 
        onSelectHistory={(historicalData: any) => setAnalysis(historicalData.result)} 
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-black tracking-tighter mb-4 italic uppercase">Suits Me Right</h1>
            <SearchBar 
              query={query} 
              setQuery={setQuery} 
              onSearch={() => handleSearch()} 
              isLoading={isAnalyzing} 
            />
          </div>

          {error && <p className="text-red-500 mb-6 bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}

          {analysis ? (
            <AnalysisResults analysis={analysis} user={user} />
          ) : (
            !isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 rounded-[40px]">
                <p className="text-zinc-400 font-medium">Search for a product to begin your AI audit.</p>
              </div>
            )
          )}

          {isAnalyzing && (
            <div className="space-y-6 animate-pulse">
              <div className="h-64 bg-zinc-200 rounded-3xl" />
              <div className="h-40 bg-zinc-200 rounded-3xl" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}