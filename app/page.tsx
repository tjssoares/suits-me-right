'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [compareList, setCompareList] = useState<any[]>([]); // Track items to compare
  const [analysis, setAnalysis] = useState<{ summary: string; score: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const supabase = createClientComponentClient();

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
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
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
          {history.map((item) => {
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
          })}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto">
        <nav className="flex justify-end p-6 gap-4">
          <button onClick={() => window.location.href = "/login"} className="text-gray-400 text-sm">Sign In</button>
          <button onClick={() => window.location.href = "/login"} className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm">Join Free</button>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-12">
          
          {/* Comparison Mode Header */}
          {compareList.length === 2 ? (
            <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-3xl mb-12 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Head-to-Head Comparison</h2>
                <button onClick={() => setCompareList([])} className="text-xs text-gray-400 hover:text-white uppercase font-bold">Clear All</button>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {compareList.map(item => (
                  <div key={item.id} className="bg-black/40 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-xl font-bold mb-2 text-indigo-400">{item.product_name}</h4>
                    <p className="text-sm text-gray-400 mb-4 italic">"{item.analysis_summary.substring(0, 150)}..."</p>
                    <div className="text-3xl font-black">{item.durability_score}<span className="text-xs text-gray-600 ml-1">Score</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 text-center">
                 <p className="text-gray-400">Want an AI deep-dive on which one is better for <span className="text-white font-bold">you</span> specifically? <span className="text-indigo-400 cursor-pointer hover:underline">Ask Gemini →</span></p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-extrabold mb-10 tracking-tight">Stop buying junk.</h2>
              <div className="relative max-w-xl mx-auto mb-12 group">
                <input 
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search a product to analyze..." 
                  className="w-full bg-white/5 border border-white/20 rounded-2xl py-5 px-6 focus:outline-none focus:border-indigo-500 transition-all text-lg shadow-2xl"
                />
                <button onClick={() => handleSearch()} disabled={isAnalyzing} className="absolute right-3 top-3 bg-indigo-600 px-6 py-2.5 rounded-xl font-bold">{isAnalyzing ? '...' : 'Analyze'}</button>
              </div>
            </div>
          )}

          {/* Regular Result View */}
          {analysis && !isAnalyzing && compareList.length < 2 && (
            <div className="p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 text-left animate-in fade-in slide-in-from-bottom-4">
               <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4">{query}</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">"{analysis.summary}"</p>
                  </div>
                  <div className="bg-black/60 p-6 rounded-2xl border border-white/10 text-center min-w-[140px]">
                    <span className="text-[10px] text-gray-500 uppercase font-black">Score</span>
                    <div className="text-6xl font-black text-green-400">{analysis.score}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
