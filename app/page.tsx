'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load User & History
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setHistory(data || []);
  };

  const handleSearch = async () => {
    if (!query) return;
    setAnalysis(null); 
    setIsAnalyzing(true);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: query, userId: user?.id }),
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

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-white/10">
        <h1 className="text-2xl font-black tracking-tighter italic">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></h1>
        <div>
          {user ? (
            <span className="text-sm text-gray-400">Welcome, {user.email}</span>
          ) : (
            <Link href="/login" className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition">
              Login / Sign Up
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Search Box with Enter Key Support */}
        <div className="relative mb-12 mt-10">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // FIX: Enter key now works
            className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-xl focus:border-indigo-500 outline-none transition"
            placeholder="Search a product (e.g. Sony WH-1000XM5)..."
          />
          <button 
            onClick={handleSearch}
            disabled={isAnalyzing}
            className="absolute right-4 top-4 bg-indigo-600 px-8 py-2 rounded-xl font-bold hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {isAnalyzing ? '...' : 'Analyze'}
          </button>
        </div>

        {/* LOADING STATE */}
        {isAnalyzing && (
          <div className="text-center py-20 animate-pulse">
            <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold italic">Consulting durability databases...</h2>
            <p className="text-gray-500">Scanning for known failure points and best prices.</p>
          </div>
        )}

        {/* RESULTS */}
        {analysis && !isAnalyzing && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Main Result Card */}
            <div className="grid md:grid-cols-2 gap-8 items-center bg-white/5 p-8 rounded-3xl border border-white/10">
              <img src={analysis.image_url} alt="Product" className="rounded-2xl w-full h-64 object-cover bg-neutral-900 border border-white/10" />
              <div>
                <div className="text-5xl font-black text-indigo-500 mb-2">{analysis.score_label}</div>
                <p className="text-gray-300 text-lg leading-relaxed italic">"{analysis.summary}"</p>
              </div>
            </div>

            {/* VENDOR TABLE */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Where to Buy</h3>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 font-bold">
                    <tr>
                      <th className="p-4 uppercase text-[10px] text-gray-400">Supplier</th>
                      <th className="p-4 uppercase text-[10px] text-gray-400">Current Price</th>
                      <th className="p-4 text-right uppercase text-[10px] text-gray-400">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.vendors?.map((v: any, i: number) => (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 font-bold">{v.name}</td>
                        <td className="p-4 text-indigo-400 font-mono">{v.price}</td>
                        <td className="p-4 text-right">
                          <a href={v.url} target="_blank" className="bg-white text-black px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-500 hover:text-white transition">Shop Now</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLICKABLE RECOMMENDATION */}
            <div className="bg-indigo-600/10 border border-indigo-500/30 p-8 rounded-3xl flex items-center gap-6">
               <img src={analysis.alternative?.image} className="w-24 h-24 rounded-xl object-cover bg-black border border-white/10" />
               <div className="flex-1">
                 <h4 className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mb-1">Expert Pick for Longevity</h4>
                 <p className="text-xl font-bold mb-1">{analysis.alternative?.name}</p>
                 <p className="text-gray-400 text-sm mb-4">{analysis.alternative?.reason}</p>
                 <button 
                  onClick={() => { setQuery(analysis.alternative.name); handleSearch(); }}
                  className="text-white underline text-xs font-bold hover:text-indigo-400"
                 >
                   Analyze this instead →
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}