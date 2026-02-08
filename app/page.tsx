'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState('United Kingdom');
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  
  // State to force Sidebar to re-fetch when a new search is saved
  const [sidebarKey, setSidebarKey] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => { if(data.country_name) setLocation(data.country_name) })
      .catch(() => console.warn("Location blocked by browser."));
  }, []);

  if (!mounted) return null;

  const handleSearch = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q) return;

    setAnalysis(null);
    setError(null);
    setIsAnalyzing(true);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: q, userId: user?.id, location }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch results.");
      }
      
      const data = await res.json();
      
      if (!data.main_product) {
        throw new Error("AI returned an empty analysis. Try a different product name.");
      }

      setAnalysis(data);

      // SAVE TO HISTORY
      if (user) {
        const { error: saveError } = await supabase.from('search_history').insert([
          { 
            user_id: user.id, 
            product_name: data.main_product.name,
            query: q, 
            result: data 
          }
        ]);
        
        if (!saveError) {
          // Trigger sidebar refresh
          setSidebarKey(prev => prev + 1);
        }
      }

    } catch (e: any) {
      console.error("Search Error:", e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020202] text-white font-sans">
      
      {/* SIDEBAR COMPONENT - Forced to refresh via key */}
      <Sidebar 
        key={sidebarKey} 
        onSelectHistory={(historicalData) => {
          setAnalysis(historicalData);
          setQuery("");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <nav className="max-w-6xl mx-auto flex justify-between items-center mb-10">
          <h1 className="text-xl font-black italic tracking-tighter">SUITS ME RIGHT</h1>
          <div className="flex items-center gap-4">
            <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-500">📍 {location}</span>
            {!user ? (
              <Link href="/login" className="text-xs font-bold border border-white/10 px-4 py-2 rounded-full hover:bg-white hover:text-black transition">Login</Link>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Premium Member</span>
                <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] text-gray-600 hover:text-white underline">Logout</button>
              </div>
            )}
          </div>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="relative mb-8">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-lg outline-none focus:border-indigo-500 transition-all shadow-2xl"
              placeholder="Search e.g. 'iPhone 15' or 'Dyson Vacuum'..."
            />
            <button 
              onClick={() => handleSearch()} 
              disabled={isAnalyzing} 
              className="absolute right-3 top-3 bg-indigo-600 px-8 py-3 rounded-2xl font-bold uppercase text-xs hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl mb-8 text-center">
              <p className="text-red-400 text-sm font-bold">{error}</p>
              <button onClick={() => handleSearch()} className="mt-3 text-xs underline text-red-300">Try Again</button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-24">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-indigo-400 font-bold tracking-[0.2em] uppercase text-sm">Auditing {location} Market...</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
              {/* PRODUCT CARD */}
              <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="bg-neutral-900 rounded-[35px] p-8 flex items-center justify-center min-h-[320px] border border-white/5 relative group overflow-hidden">
                    <img 
                      src={analysis.main_product?.image} 
                      className="max-h-72 object-contain transition-transform group-hover:scale-105" 
                      onError={(e:any) => e.target.src='https://placehold.co/400x400?text=Image+Not+Available'} 
                    />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black mb-4 leading-tight">{analysis.main_product?.name}</h2>
                    
                    {/* QUALITIES / KEY FEATURES */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {analysis.main_product?.qualities?.map((quality: string, idx: number) => (
                        <span key={idx} className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                          {quality}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-1 mb-8">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(analysis.main_product?.stars || 0) ? "text-yellow-400 text-2xl" : "text-white/10 text-2xl"}>★</span>
                      ))}
                    </div>
                    
                    {/* NEW DEALS SECTION */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Deals (New)</h4>
                      {analysis.main_product?.new_deals?.map((d:any, i:number) => (
                        <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500 transition group">
                          <span className="font-bold text-sm tracking-tight">{d.vendor}</span>
                          <span className="text-indigo-400 font-bold text-lg group-hover:translate-x-1 transition-transform">{d.price} →</span>
                        </a>
                      ))}
                    </div>

                    {/* USED DEALS SECTION */}
                    <div className="space-y-4 mt-8">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Pre-Owned & Refurbished</h4>
                      {analysis.main_product?.used_deals?.length > 0 ? (
                        analysis.main_product.used_deals.map((d: any, i: number) => (
                          <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500 transition group">
                            <span className="font-bold text-sm tracking-tight">{d.vendor} (Used)</span>
                            <span className="text-emerald-400 font-bold text-lg group-hover:translate-x-1 transition-transform">{d.price} →</span>
                          </a>
                        ))
                      ) : (
                        <p className="text-xs text-gray-600 italic">No direct second-hand links found.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* COMPETITOR COMPARISON TABLE */}
                {analysis.main_product?.competitors?.length > 0 && (
                  <div className="mt-12 pt-10 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Market Alternatives</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.main_product.competitors.map((comp: any, i: number) => (
                        <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                          <span className="font-bold text-gray-300">{comp.name}</span>
                          <span className="text-indigo-400 font-black">{comp.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SUITS ME RIGHT REASONING */}
              <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
                 <h3 className="text-xl font-bold mb-6 text-indigo-300 italic tracking-tight">This suits me right because:</h3>
                 <div className={!user ? "filter blur-2xl opacity-10 pointer-events-none select-none" : "opacity-100"}>
                   <div className="text-lg leading-relaxed text-indigo-50 font-medium whitespace-pre-line space-y-4">
                     {analysis?.suits_me_reason || "No reasoning provided for this search."}
                   </div>
                 </div>
                 {!user && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-all">
                     <div className="text-center p-8">
                       <p className="font-bold mb-6 text-sm text-gray-300 uppercase tracking-[0.3em]">Premium Audit Report</p>
                       <Link href="/login" className="bg-white text-black px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-50 transition uppercase text-xs tracking-widest">
                         Sign in to View Reasoning
                       </Link>
                     </div>
                   </div>
                 )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}