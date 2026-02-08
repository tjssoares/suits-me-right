"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import AnalysisResults from "@/components/AnalysisResults";

export default function HomePage() {
  const supabase = createClientComponentClient();
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarKey, setSidebarKey] = useState(0);

  // 1. Monitor Auth State
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  // 2. Search Logic with Database Storage
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

      if (!res.ok) throw new Error("Search failed. Please try again.");
      
      const data = await res.json();
      setAnalysis(data);

      // SAVE TO HISTORY (SCHEMA COMPLIANT)
      if (user) {
        const { error: saveError } = await supabase.from("search_history").insert([
          {
            user_id: user.id,
            product_name: data.main_product.name,
            analysis_summary: data.main_product.public_summary,
            durability_score: data.main_product.durability || 0,
            result: data, // JSONB: contains competitors and vendor links
            metadata: { 
              timestamp: new Date().toISOString(),
              location: "United Kingdom" // Can be dynamic
            }
          }
        ]);
        
        // Triggers Sidebar to re-fetch the new entry
        if (!saveError) setSidebarKey(prev => prev + 1);
        else console.error("History storage error:", saveError.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#fafafa] text-zinc-900 overflow-hidden">
      {/* Sidebar handles history selection and triggers re-renders via sidebarKey */}
      <Sidebar 
        key={sidebarKey} 
        onSelectHistory={(historicalItem: any) => {
          // historicalItem is the full row from DB, we want the 'result' column
          setAnalysis(historicalItem.result);
        }} 
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-12">
          
          {/* Top Search Section */}
          <div className="mb-12">
            <SearchBar 
              query={query} 
              setQuery={setQuery} 
              onSearch={() => handleSearch()} 
              isLoading={isAnalyzing} 
            />
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-4 mb-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Dynamic Analysis View */}
          {analysis ? (
            <AnalysisResults analysis={analysis} user={user} />
          ) : (
            !isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h2 className="text-xl font-semibold text-zinc-400">
                  Ready to audit your next purchase?
                </h2>
                <p className="text-zinc-400 text-sm mt-2">
                  Enter a product name above to start the AI analysis.
                </p>
              </div>
            )
          )}

          {/* Loading Skeleton Placeholder */}
          {isAnalyzing && (
            <div className="space-y-8 animate-pulse">
              <div className="h-64 bg-zinc-100 rounded-3xl w-full" />
              <div className="h-32 bg-zinc-100 rounded-3xl w-full" />
              <div className="grid grid-cols-2 gap-6">
                <div className="h-48 bg-zinc-100 rounded-3xl" />
                <div className="h-48 bg-zinc-100 rounded-3xl" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}