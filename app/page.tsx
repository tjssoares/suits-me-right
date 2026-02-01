'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [location, setLocation] = useState('');
  const [user, setUser] = useState<any>(null);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // 1. Detect Location on Load
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => setLocation(data.country_name))
      .catch(() => setLocation('')); // Fallback to ask
    
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSearch = async (customQuery?: string, overrideLocation?: string) => {
    const q = customQuery || query;
    const loc = overrideLocation || location;
    if (!q) return;

    setAnalysis(null);
    setIsAnalyzing(true);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: q, userId: user?.id, location: loc }),
      });
      const data = await res.json();
      setAnalysis(data);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex text-yellow-500">
      {[...Array(5)].map((_, i) => <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>)}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans p-4 md:p-8">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-xl font-black italic tracking-tighter uppercase">Suits Me Right</h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full text-gray-400">📍 {location || "Searching Location..."}</span>
          {!user && <Link href="/login" className="text-xs font-bold border border-white/20 px-4 py-2 rounded-full">Login</Link>}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-8">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/5 border border-white/10 p-6 rounded-[25px] text-lg outline-none focus:border-indigo-500"
            placeholder="Search for a product..."
          />
          <button onClick={() => handleSearch()} className="absolute right-3 top-3 bg-indigo-600 px-6 py-3 rounded-2xl font-bold">Analyze</button>
        </div>

        {/* Location Request if missing */}
        {!location && !isAnalyzing && (
          <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl mb-8 text-center">
            <p className="text-sm text-orange-200">We couldn't detect your country. Where are you shopping from?</p>
            <input 
              className="mt-2 bg-black border border-white/20 rounded-lg px-4 py-1 text-sm outline-none" 
              placeholder="e.g. United Kingdom"
              onKeyDown={(e:any) => e.key === 'Enter' && setLocation(e.target.value)}
            />
          </div>
        )}

        {isAnalyzing && <div className="text-center py-20 animate-pulse text-indigo-400 font-bold">Auditing {location} Markets...</div>}

        {analysis && (
          <div className="space-y-8">
            {/* Main Product Card */}
            <div className="bg-white/5 border border-white/10 rounded-[35px] p-8 grid md:grid-cols-2 gap-8">
              <div className="bg-black rounded-3xl p-6 flex items-center justify-center border border-white/5">
                <img src={analysis.main_product.image} className="max-h-60 object-contain" onError={(e:any) => e.target.src='https://placehold.co/400x400?text=Product+Image'} />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{analysis.main_product.name}</h2>
                <StarRating rating={analysis.main_product.stars} />
                
                {/* NEW DEALS */}
                <div className="mt-8">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase mb-3">Brand New Deals ({location})</h4>
                  <div className="space-y-2">
                    {analysis.main_product.new_deals.map((d:any, i:number) => (
                      <a key={i} href={d.url} target="_blank" className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                        <span className="font-bold">{d.vendor}</span>
                        <span className="text-indigo-400 font-bold">{d.price} →</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* USED DEALS (RESTORED) */}
                <div className="mt-6">
                  <h4 className="text-[10px] font-black text-green-500 uppercase mb-3">Refurbished / Used</h4>
                  <div className="space-y-2">
                    {analysis.main_product.used_deals.map((d:any, i:number) => (
                      <a key={i} href={d.url} target="_blank" className="flex justify-between items-center p-4 bg-green-500/5 border border-green-500/20 rounded-xl hover:bg-green-500/10 transition text-sm">
                        <span className="font-medium text-green-200">{d.vendor}</span>
                        <span className="text-green-400 font-bold">{d.price}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SUITS ME RIGHT SECTION (RESTORED & IMPROVED) */}
            <section className="bg-indigo-600/10 border border-indigo-500/30 rounded-[35px] p-10 relative overflow-hidden">
               <h3 className="text-xl font-bold mb-4 text-indigo-400 italic">This suits me right because:</h3>
               <div className={!user ? "filter blur-2xl opacity-20 pointer-events-none" : ""}>
                 <p className="text-lg leading-relaxed text-indigo-100">{analysis.suits_me_reason}</p>
               </div>
               {!user && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                   <Link href="/login" className="bg-white text-black px-8 py-3 rounded-2xl font-black">Unlock Member Analysis</Link>
                 </div>
               )}
            </section>

            {/* COMPARISON LIST */}
            <section className="grid md:grid-cols-2 gap-6">
              {analysis.equivalents.map((item:any, i:number) => (
                <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[35px] hover:border-indigo-500 transition group">
                   <img src={item.image} className="h-40 mx-auto mb-6 object-contain group-hover:scale-105 transition" />
                   <h4 className="text-xl font-bold mb-1">{item.name}</h4>
                   <StarRating rating={item.stars} />
                   <p className="text-sm text-gray-500 my-4">{item.diff}</p>
                   <button onClick={() => handleSearch(item.name)} className="w-full py-3 bg-white/10 rounded-xl font-bold hover:bg-indigo-600 transition">Compare This</button>
                </div>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}