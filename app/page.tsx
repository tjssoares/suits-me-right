'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSearch = async () => {
    if (!query) return;
    
    // FIX: Clear previous results immediately so they don't mix
    setAnalysis(null); 
    setIsAnalyzing(true);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: query }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-center tracking-tighter">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></h1>

        {/* Search Box */}
        <div className="relative mb-12">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-xl focus:border-indigo-500 outline-none transition"
            placeholder="What are we buying?"
          />
          <button 
            onClick={handleSearch}
            className="absolute right-4 top-4 bg-indigo-600 px-8 py-2 rounded-xl font-bold hover:bg-indigo-500 transition"
          >
            Analyze
          </button>
        </div>

        {/* VISUAL FEEDBACK: Thinking State */}
        {isAnalyzing && (
          <div className="text-center py-20 animate-pulse">
            <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold">Researching {query}...</h2>
            <p className="text-gray-500">Scanning reviews, failure reports, and live prices.</p>
          </div>
        )}

        {/* RESULTS: Images, Score, Vendors */}
        {analysis && !isAnalyzing && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid md:grid-cols-2 gap-8 items-center bg-white/5 p-8 rounded-3xl border border-white/10">
              <img src={analysis.image_url} alt="Product" className="rounded-2xl w-full h-64 object-cover bg-black" />
              <div>
                <div className="text-6xl font-black text-indigo-500 mb-2">{analysis.score_label}</div>
                <p className="text-gray-300 text-lg leading-relaxed">{analysis.summary}</p>
              </div>
            </div>

            {/* VENDOR TABLE */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Where to Buy</h3>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 font-bold">
                    <tr>
                      <th className="p-4">Supplier</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.vendors?.map((v: any, i: number) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="p-4 font-bold">{v.name}</td>
                        <td className="p-4 text-indigo-400">{v.price}</td>
                        <td className="p-4 text-right">
                          <a href={v.url} target="_blank" className="bg-white text-black px-4 py-1 rounded-lg font-bold text-xs">View Deal</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IDEAL ALTERNATIVE */}
            <div className="bg-indigo-600/10 border border-indigo-500/30 p-8 rounded-3xl">
              <h3 className="text-indigo-400 font-bold mb-2 uppercase text-xs tracking-widest">Personal Recommendation</h3>
              <div className="flex gap-6 items-center">
                <img src={analysis.alternative?.image} className="w-20 h-20 rounded-lg bg-black object-cover" />
                <div>
                  <h4 className="text-xl font-bold">Try the {analysis.alternative?.name} instead</h4>
                  <p className="text-gray-400 text-sm">{analysis.alternative?.reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}