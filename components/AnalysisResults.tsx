"use client";

import { useState } from "react";
import { Star, ExternalLink, CheckCircle2, ShieldCheck, Package, ShoppingBag, History } from "lucide-react";

interface AnalysisResultsProps {
  analysis: any;
  user: any;
  isHistorical?: boolean; // Added this prop
}

const ProductImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`${className} bg-zinc-100 flex items-center justify-center`}>
        <Package className="w-12 h-12 text-zinc-300" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
};

export default function AnalysisResults({ analysis, user, isHistorical = false }: AnalysisResultsProps) {
  if (!analysis || !analysis.main_product) return null;

  const { main_product, suits_me_reason } = analysis;

  return (
    <div className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* HISTORICAL BADGE */}
      {isHistorical && (
        <div className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-500 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-[-20px]">
          <History className="w-3 h-3" />
          Showing Historical Result
        </div>
      )}

      {/* MAIN PRODUCT HERO */}
      <section className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 bg-zinc-50 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-200">
            <ProductImage 
              src={main_product.image} 
              alt={main_product.name} 
              className="max-h-72 object-contain mix-blend-multiply rounded-lg w-full h-full"
            />
          </div>
          <div className="flex-1 p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-zinc-900">{main_product.name}</h1>
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
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

      {/* SUITS ME RIGHT ANALYSIS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-8 h-8 text-indigo-200" />
            <h2 className="text-2xl font-extrabold tracking-tight italic">Suits Me Right Analysis</h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
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
                <Link href="/login" className="inline-block bg-white text-indigo-600 px-6 py-2 rounded-full font-bold text-sm">
                  Sign in for Full AI Analysis
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      {/* MARKET RIVALS */}
      <section>
        <h2 className="text-xl font-bold text-zinc-800 mb-6 flex items-center gap-2">
          Market Rivals & Alternatives
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {main_product.competitors?.map((comp: any, idx: number) => (
            <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition group flex flex-col h-full">
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 flex-shrink-0 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100">
                   <ProductImage 
                      src={comp.image} 
                      alt={comp.name} 
                      className="w-full h-full object-contain p-2"
                    />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition">{comp.name}</h3>
                  <p className="text-emerald-600 font-bold mb-1">{comp.price}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-zinc-500">{comp.stars} Rating</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <ul className="space-y-2 mb-6">
                  {comp.highlights?.map((h: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-zinc-100 mt-auto">
                 {comp.url ? (
                    <a 
                      href={comp.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-sm font-semibold text-zinc-700 transition"
                    >
                      Product Details <ExternalLink className="w-3 h-3" />
                    </a>
                 ) : (
                    <span className="flex items-center justify-center w-full py-2 bg-zinc-50 text-zinc-400 text-sm rounded-lg cursor-not-allowed">
                       Link Unavailable
                    </span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE DEALS (HIDDEN IF HISTORICAL) */}
      {!isHistorical && main_product.new_deals && main_product.new_deals.length > 0 && (
        <section>
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">
                Verified Vendor Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {main_product.new_deals.map((deal: any, i: number) => (
                <a 
                    key={i} 
                    href={deal.url} 
                    target="_blank" 
                    className="flex flex-col p-4 bg-white border border-zinc-200 rounded-2xl hover:shadow-lg hover:border-indigo-300 transition group"
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-zinc-400 uppercase">{deal.vendor}</span>
                        <ShoppingBag className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition"/>
                    </div>
                    <span className="text-xl font-black text-zinc-900 group-hover:text-indigo-600 transition">{deal.price}</span>
                    <span className="mt-2 text-[10px] font-bold text-indigo-500 uppercase">Go to Store →</span>
                </a>
                ))}
            </div>
        </section>
      )}

    </div>
  );
}