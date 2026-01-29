'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// Define the shape of our "Premium" analysis
interface PremiumAnalysis {
  summary: string;
  score: number;
  pros: string[];
  cons: string[];
  common_failures: string[];
  market_position: string;
  expected_lifespan: string;
  repairability: string;
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<PremiumAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchHistory = async () => {
    // Fetching latest 10 searches for the sidebar
    const { data } = await supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    setHistory(data || []);
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: q, userId: session?.user.id }),
      });
      const data = await res.json();
      
      // If the AI returned the new metadata structure, use it. 
      // Otherwise, default to the basic summary.
      setAnalysis(data);
      fetchHistory();
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const toggleCompare = (item: any) => {
    if (compareList.find(i => i.id === item.id)) {
      setCompareList(compareList.filter(i => i.id !== item.id));
    } else if (compareList.length < 2) {
      setCompareList([...compareList, item]);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 border-r border-white/10 hidden lg:flex flex-col bg-[#050505]">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-bold tracking-tighter">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 mb-4 italic">History (Global Feed)</p>
          {history.map((item) => {
            const isSelected = compareList.find(i => i.id === item.id);
            return (
              <div key={item.id} className={`group relative p-3 rounded-xl border transition ${isSelected ? 'bg-indigo-500/10 border-indigo-500' : 'hover:bg-white/5 border-transparent'}`}>
                <button 
                  onClick={() => { 
                    setQuery(item.product_name); 
                    // Load the rich metadata if it exists, otherwise use legacy columns
                    setAnalysis(item.metadata || { summary: item.analysis_summary, score: item.durability_score }); 
                  }}
                  className="w-full text-left"
                >
                  <p className="text-sm font-bold truncate group-hover:text-indigo-400">{item.product_name}</p>
                </button>
                <button 
                  onClick={() => toggleCompare(item)}
                  className={`mt-2 text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'}`}
                >
                  {isSelected ? 'Selected' : 'Compare'}
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <nav className="flex justify-between items-center p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-10">
          <div className="lg:hidden font-bold tracking-tighter">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></div>
          <div className="flex gap-4 ml-auto">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm mt-2 transition">Sign In</Link>
            <Link href="/login" className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition">Join Free</Link>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 w-full">
          
          {/* Welcome Section */}
          {!analysis && !isAnalyzing && (
            <div className="mb-16 text-center">
              <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent leading-tight">
                Stop buying junk.
              </h2>
              <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                Unlock "Premium Mode" testing: Deep-dive durability, failure points, and market comparisons for any product.
              </p>
            </div>
          )}

          {/* Search Input */}
          <div className="relative max-w-xl mx-auto mb-12 group">
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter product name (e.g. iPhone 15 Pro)..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 focus:outline-none focus:border-indigo-500 transition-all text-lg shadow-2xl placeholder:text-gray-600"
            />
            <button 
              onClick={() => handleSearch()} 
              disabled={isAnalyzing} 
              className="absolute right-3 top-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {/* Result View (Premium Enhanced) */}
          {analysis && !isAnalyzing && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Score & Summary Card */}
              <div className="p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)]">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-indigo-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Premium Report</span>
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{query}</h3>
                    </div>
                    <p className="text-gray-200 leading-relaxed text-lg font-medium">
                      {analysis.summary}
                    </p>
                  </div>
                  <div className="bg-black/60 p-8 rounded-3xl border border-white/10 text-center min-w-[160px] shadow-inner">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Durability</span>
                    <div className={`text-7xl font-black drop-shadow-lg ${analysis.score > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {analysis.score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pros & Cons / Failures Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="text-green-400 font-bold uppercase text-xs tracking-widest mb-4">Core Strengths</h4>
                  <ul className="space-y-3">
                    {analysis.pros?.map((p, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-500">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="text-red-400 font-bold uppercase text-xs tracking-widest mb-4">Known Failure Points</h4>
                  <ul className="space-y-3">
                    {analysis.common_failures?.map((f, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-red-500">⚠</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Market Comparison Card */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                      <h4 className="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-2">Market Comparison</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{analysis.market_position}</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">Expected Life</h4>
                        <p className="text-white font-bold">{analysis.expected_lifespan || "N/A"}</p>
                      </div>
                      <div>
                        <h4 className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">Repairability</h4>
                        <p className="text-white font-bold">{analysis.repairability || "Moderate"}</p>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Empty State / Benefits */}
          {!analysis && !isAnalyzing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-indigo-500 mb-4 font-bold text-2xl">01.</div>
                <h4 className="font-bold mb-2">Market Intelligence</h4>
                <p className="text-sm text-gray-500">We compare against rivals to see if you're getting the best build for your buck.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-indigo-500 mb-4 font-bold text-2xl">02.</div>
                <h4 className="font-bold mb-2">Failure Prediction</h4>
                <p className="text-sm text-gray-500">Identify exactly what breaks after 12 months of use before you buy it.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-indigo-500 mb-4 font-bold text-2xl">03.</div>
                <h4 className="font-bold mb-2">Repairability</h4>
                <p className="text-sm text-gray-500">Know if it’s a "disposable" product or something that can actually be fixed.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}