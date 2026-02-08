"use client";

import { Star, ExternalLink, CheckCircle2, ShieldCheck } from "lucide-react";

interface AnalysisResultsProps {
  analysis: any;
  user: any; // Passed from page.tsx to check if registered
}

export default function AnalysisResults({ analysis, user }: AnalysisResultsProps) {
  if (!analysis || !analysis.main_product) return null;

  const { main_product, suits_me_reason } = analysis;

  return (
    <div className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* MAIN PRODUCT HERO */}
      <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 bg-zinc-50 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-200">
            <img 
              src={main_product.image} 
              alt={main_product.name} 
              className="max-h-72 object-contain mix-blend-multiply shadow-lg rounded-lg"
              onError={(e: any) => { e.target.src = "https://via.placeholder.com/400?text=Product+Image"; }}
            />
          </div>
          <div className="flex-1 p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-zinc-900">{main_product.name}</h1>
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-yellow-700">{main_product.stars || 5}</span>
              </div>
            </div>
            <p className="text-zinc-600 leading-relaxed mb-6 text-lg">
              {main_product.public_summary}
            </p>
            <div className="flex flex-wrap gap-2">
              {main_product.qualities?.map((q: string) => (
                <span key={q} className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-md text-sm font-medium border border-zinc-200">
                  {q}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SUITS ME RIGHT AREA (PREMIUM) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-8 h-8 text-indigo-200" />
            <h2 className="text-2xl font-extrabold tracking-tight italic">Suits Me Right Analysis</h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            {user ? (
              <div className="space-y-4">
                <p className="text-indigo-50 leading-relaxed whitespace-pre-line text-lg italic">
                  "{suits_me_reason}"
                </p>
                <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-sm font-semibold text-indigo-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified AI Durability Score: {main_product.durability}%
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-indigo-100 mb-4">You are viewing the basic summary.</p>
                <button className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold hover:bg-indigo-50 transition">
                  Sign in for Full AI Analysis
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Abstract background shape */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      {/* COMPETITORS SECTION */}
      <section>
        <h2 className="text-xl font-bold text-zinc-800 mb-6 flex items-center gap-2">
          Market Rivals & Alternatives
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {main_product.competitors?.map((comp: any, idx: number) => (
            <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition group">
              <div className="flex gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  <img src={comp.image} className="w-full h-full object-contain rounded-lg" alt={comp.name} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition">{comp.name}</h3>
                  <p className="text-emerald-600 font-bold mb-1">{comp.price}</p>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-zinc-500">{comp.stars} Rating</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <ul className="space-y-2 mb-6">
                  {comp.highlights?.map((h: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
                <a 
                  href={comp.url} 
                  target="_blank" 
                  className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-sm font-semibold text-zinc-700 transition"
                >
                  Product Details <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}