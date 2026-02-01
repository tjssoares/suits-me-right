'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<any[]>([]);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSearch = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q) return;
    setAnalysis(null);
    setIsAnalyzing(true);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productQuery: q, userId: user?.id }),
    });
    setAnalysis(await res.json());
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-4 md:p-10">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black italic tracking-tighter">SUITS ME RIGHT.AI</h1>
        <div className="flex gap-4">
          {!user ? (
            <Link href="/login" className="bg-indigo-600 px-6 py-2 rounded-full font-bold text-sm">Login / Register</Link>
          ) : (
            <span className="text-gray-500 text-sm">Account: {user.email}</span>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto">
        {/* Search Input */}
        <div className="relative mb-16">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xl outline-none focus:border-indigo-500 transition-all"
            placeholder="Search any product (e.g. Dyson V15)..."
          />
          <button onClick={() => handleSearch()} className="absolute right-4 top-4 bg-indigo-600 px-8 py-2 rounded-2xl font-bold hover:bg-indigo-500">Analyze</button>
        </div>

        {isAnalyzing && <div className="text-center py-20 animate-pulse text-indigo-500 font-bold">Auditing UK Market & Durability Data...</div>}

        {analysis && (
          <div className="space-y-10">
            {/* 1. Main Product Header */}
            <section className="bg-white/5 border border-white/10 rounded-[40px] p-8 grid md:grid-cols-2 gap-10 items-center">
              <div className="bg-neutral-900 rounded-3xl p-4 flex items-center justify-center min-h-[300px]">
                <img src={analysis.main_product.image} alt="product" className="max-h-64 object-contain" />
              </div>
              <div>
                <h2 className="text-4xl font-black mb-2">{analysis.main_product.name}</h2>
                <div className="flex text-yellow-500 text-xl mb-6">★★★★☆ <span className="text-gray-500 text-sm ml-2">({analysis.main_product.stars}/5)</span></div>
                <p className="text-gray-400 leading-relaxed mb-6">{analysis.main_product.description}</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.main_product.specs.map((s:any, i:number) => <span key={i} className="bg-white/5 px-3 py-1 rounded-md text-xs text-gray-300">{s}</span>)}
                </div>
              </div>
            </section>

            {/* 2. SUITS ME RIGHT SECTION (PERSONALIZED) */}
            <section className="relative overflow-hidden bg-indigo-600/10 border border-indigo-500/30 rounded-[40px] p-10">
              <h3 className="text-xl font-bold mb-4 text-indigo-400 italic">This suits me right because:</h3>
              <div className={!user ? "filter blur-md pointer-events-none select-none" : ""}>
                <p className="text-lg leading-relaxed">{analysis.suits_me_reason}</p>
              </div>
              {!user && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                  <p className="font-bold mb-4">Register to see your personal match logic</p>
                  <Link href="/login" className="bg-white text-black px-6 py-2 rounded-full font-bold">Unlock Personal Analysis</Link>
                </div>
              )}
            </section>

            {/* 3. VENDORS TABLE (UK FOCUS) */}
            <section className="bg-white/5 border border-white/10 rounded-[40px] p-8">
               <h3 className="text-sm font-black text-gray-500 uppercase mb-6 tracking-widest">Local UK Availability</h3>
               <div className="space-y-3">
                 {analysis.main_product.vendors.map((v:any, i:number) => (
                   <div key={i} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition">
                     <span className="font-bold">{v.name}</span>
                     <div className="flex items-center gap-6">
                        <span className="text-indigo-400 font-mono text-lg">{v.price}</span>
                        <a href={v.url} target="_blank" className="bg-white text-black px-5 py-2 rounded-xl font-bold text-xs">Buy →</a>
                     </div>
                   </div>
                 ))}
               </div>
            </section>

            {/* 4. COMPARISON AREA */}
            <section>
              <h3 className="text-xl font-bold mb-6">Market Equivalents</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {analysis.equivalents.map((item: any, i: number) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[40px] hover:border-indigo-500 transition">
                    <img src={item.image} className="h-40 mx-auto mb-6 object-contain" />
                    <h4 className="text-xl font-bold mb-1">{item.name}</h4>
                    <span className="text-indigo-400 font-bold block mb-4">{item.price}</span>
                    <p className="text-sm text-gray-500 mb-6">{item.why_better}</p>
                    <button 
                      onClick={() => handleSearch(item.name)}
                      className="w-full py-3 bg-white/10 rounded-2xl font-bold hover:bg-indigo-600 transition"
                    >
                      Compare & Audit
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