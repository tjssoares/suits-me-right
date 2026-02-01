'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1 text-yellow-500">
      {[...Array(5)].map((_, i) => (
        <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
      ))}
      <span className="text-gray-400 text-xs ml-2">({rating}/5)</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6">
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-2xl font-black italic">SUITS ME RIGHT<span className="text-indigo-500">.AI</span></h1>
        <Link href="/login" className="text-sm font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20">Login</Link>
      </nav>

      <div className="max-w-4xl mx-auto">
        {/* Search */}
        <div className="relative mb-12">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xl outline-none focus:border-indigo-600"
            placeholder="Search and compare products..."
          />
          <button onClick={handleSearch} className="absolute right-4 top-4 bg-indigo-600 px-8 py-2 rounded-2xl font-bold">Analyze</button>
        </div>

        {isAnalyzing && <div className="text-center py-20 animate-pulse text-indigo-400">Deep searching live markets...</div>}

        {analysis && (
          <div className="space-y-12">
            {/* Primary Product */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 grid md:grid-cols-2 gap-8">
              <img src={analysis.main_product.image} className="w-full h-80 object-contain bg-neutral-900 rounded-2xl" />
              <div>
                <h2 className="text-3xl font-bold mb-2">{analysis.main_product.name}</h2>
                <StarRating rating={analysis.main_product.stars} />
                <p className="text-gray-400 mt-6 leading-relaxed">{analysis.main_product.durability_explanation}</p>
                
                <div className="mt-8 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Best Deals</p>
                  {analysis.main_product.vendors.map((v: any, i: number) => (
                    <a key={i} href={v.url} target="_blank" className="flex justify-between p-4 bg-white/5 rounded-xl hover:bg-indigo-600/20 transition">
                      <span className="font-bold">{v.name}</span>
                      <span className="text-indigo-400 font-mono">{v.price} →</span>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* Comparison Table */}
            <section>
              <h3 className="text-xl font-bold mb-6">Equivalents & Alternatives</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {analysis.comparisons.map((item: any, i: number) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <img src={item.image} className="w-full h-40 object-contain mb-4" />
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    <StarRating rating={item.stars} />
                    <p className="text-sm text-gray-500 my-4">{item.why}</p>
                    <button 
                      onClick={() => { setQuery(item.name); handleSearch(); }}
                      className="w-full py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-indigo-600 transition"
                    >
                      Compare This Instead
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}