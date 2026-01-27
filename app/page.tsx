'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<{ summary: string; score: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('search_history').select('*').order('created_at', { ascending: false });
      setHistory(data || []);
    }
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
    <div className="flex min-h-screen bg-black text-white font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 border-r border-white/10 hidden lg:flex flex-col bg-[#050505]">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-bold tracking-tighter">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 mb-4 italic">History (Select 2 to Compare)</p>
          {history.length > 0 ? (
            history.map((item) => {
              const isSelected = compareList.find(i => i.id === item.id);
              return (
                <div key={item.id} className={`group relative p-3 rounded-xl border transition ${isSelected ? 'bg-indigo-500/10 border-indigo-500' : 'hover:bg-white/5 border-transparent'}`}>
                  <button 
                    onClick={() => { setQuery(item.product_name); setAnalysis({ summary: item.analysis_summary, score: item.durability_score }); }}
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
            })
          ) : (
            <p className="text-xs text-gray-600 px-2">No history yet. Start searching!</p>
          )}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-10">
          <div className="lg:hidden font-bold tracking-tighter">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></div>
          <div className="flex gap-4 ml-auto">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm mt-2 transition">Sign In</Link>
            <Link href="/login" className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition">Join Free</Link>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 w-full">
          
          {/* Welcome Section */}
          <div className="mb-16 text-center">
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
              Stop buying junk.
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Analyze thousands of real reviews in seconds. Know the durability, failure points, and true value of any product before you pay.
            </p>

            {/* Search Input */}
            <div className="relative max-w-xl mx-auto mb-8 group">
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Paste a product link or name..." 
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
          </div>

          {/* Comparison Mode Header */}
          {compareList.length === 2 && (
            <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-3xl mb-12 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic">HEAD-TO-HEAD</h2>
                <button onClick={() => setCompareList([])} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest bg-white/5 px-3 py-1 rounded-full">Reset</button>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {compareList.map(item => (
                  <div key={item.id} className="bg-black/40 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-xl font-bold mb-2 text-indigo-400">{item.product_name}</h4>
                    <p className="text-sm text-gray-400 mb-4 italic leading-snug">"{item.analysis_summary.substring(0, 150)}..."</p>
                    <div className="text-3xl font-black">{item.durability_score}<span className="text-xs text-gray-600 ml-1 uppercase">Durability</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result View */}
          {analysis && !isAnalyzing && compareList.length < 2 && (
            <div className="p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 text-left animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)]">
               <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-indigo-500">{query}</h3>
                    <p className="text-gray-200 leading-relaxed text-lg font-medium">{analysis.summary}</p>
                  </div>
                  <div className="bg-black/60 p-8 rounded-3xl border border-white/10 text-center min-w-[160px] shadow-inner">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Rating</span>
                    <div className="text-7xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">{analysis.score}</div>
                  </div>
               </div>
            </div>
          )}

          {/* Benefits Grid (Only shows when no result is present) */}
          {!analysis && !isAnalyzing && compareList.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-indigo-500 mb-4 font-bold text-2xl">01.</div>
                <h4 className="font-bold mb-2">Unbiased Data</h4>
                <p className="text-sm text-gray-500">We strip away the marketing fluff and look at real customer experiences.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-indigo-500 mb-4 font-bold text-2xl">02.</div>
                <h4 className="font-bold mb-2">Durability Focused</h4>
                <p className="text-sm text-gray-500">Our AI specifically looks for failure points and long-term quality issues.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-indigo-500 mb-4 font-bold text-2xl">03.</div>
                <h4 className="font-bold mb-2">Smart Comparison</h4>
                <p className="text-sm text-gray-500">Pick two products and see which one actually lasts longer in real life.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}