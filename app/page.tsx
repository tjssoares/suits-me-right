'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [location, setLocation] = useState('United Kingdom');
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false); // Safety switch

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true); // Tell React we are safely on the client
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    // Detect location only on the client
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => { if(data.country_name) setLocation(data.country_name) })
      .catch(() => console.warn("Location detection blocked."));
  }, []);

  // Prevent rendering until mounted to stop the "Client-side Exception"
  if (!mounted) return <div className="min-h-screen bg-black" />;

  const handleSearch = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q) return;
    setAnalysis(null);
    setIsAnalyzing(true);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: q, userId: user?.id, location }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      alert("Search failed. Check your internet or API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans p-4 md:p-8">
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-xl font-black italic uppercase tracking-tighter">Suits Me Right</h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-500">📍 {location}</span>
          {!user ? (
            <Link href="/login" className="text-xs font-bold border border-white/10 px-4 py-2 rounded-full hover:bg-white hover:text-black transition">Login</Link>
          ) : (
            <span className="text-xs text-gray-500">{user.email?.split('@')[0]}</span>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="relative mb-12">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-lg outline-none focus:border-indigo-500 transition-all shadow-2xl"
            placeholder="What are you looking for?"
          />
          <button onClick={() => handleSearch()} disabled={isAnalyzing} className="absolute right-3 top-3 bg-indigo-600 px-8 py-3 rounded-2xl font-bold hover:bg-indigo-500 disabled:opacity-50">
            {isAnalyzing ? "..." : "Audit"}
          </button>
        </div>

        {isAnalyzing && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-indigo-400 font-bold animate-pulse">Analyzing {location} market availability...</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Product */}
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="bg-neutral-900 rounded-[30px] p-8 flex items-center justify-center min-h-[300px] border border-white/5 shadow-inner">
                  <img src={analysis.main_product?.image} className="max-h-64 object-contain" onError={(e:any) => e.target.src='https://placehold.co/400x400?text=Product'} />
                </div>
                <div>
                  <h2 className="text-4xl font-black mb-4 leading-tight">{analysis.main_product?.name}</h2>
                  <div className="flex gap-1 mb-8">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(analysis.main_product?.stars || 0) ? "text-yellow-400 text-2xl" : "text-white/10 text-2xl"}>★</span>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Local New Deals</h4>
                    {analysis.main_product?.new_deals?.map((d:any, i:number) => (
                      <a key={i} href={d.url} target="_blank" className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500 transition group">
                        <span className="font-bold">{d.vendor}</span>
                        <span className="text-indigo-400 font-mono font-bold group-hover:translate-x-1 transition-transform">{d.price} →</span>
                      </a>
                    ))}
                  </div>

                  {analysis.main_product?.used_deals?.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Refurbished / Pre-owned</h4>
                      {analysis.main_product.used_deals.map((d:any, i:number) => (
                        <a key={i} href={d.url} target="_blank" className="flex justify-between items-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500 transition text-sm">
                          <span className="font-medium text-emerald-100">{d.vendor}</span>
                          <span className="text-emerald-400 font-bold">{d.price}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUITS ME RIGHT (BLURRED) */}
            <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-[40px] p-10 relative overflow-hidden">
               <h3 className="text-xl font-bold mb-6 text-indigo-300 italic">This suits me right because:</h3>
               <div className={!user ? "filter blur-2xl opacity-10 pointer-events-none" : ""}>
                 <p className="text-xl leading-relaxed text-indigo-50">{analysis?.suits_me_reason}</p>
               </div>
               {!user && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                   <Link href="/login" className="bg-white text-black px-10 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition">Unlock Premium Audit</Link>
                 </div>
               )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}