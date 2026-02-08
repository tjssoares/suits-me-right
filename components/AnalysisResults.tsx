"use client";

import { useState } from "react";
import { 
  Star, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Package, 
  ShoppingBag, 
  History, 
  AlertTriangle,
  Zap
} from "lucide-react";
import Link from "next/link";

interface AnalysisResultsProps {
  analysis: any;
  user: any;
  isHistorical?: boolean;
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
  
  // Logic to determine if this is a "legacy" or "risky" product based on the new AI score
  const isLegacy = main_product.durability < 50;

  return (
    <div className="mt-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* HISTORICAL BADGE */}
      {isHistorical && (
        <div className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-500 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-[-20px] border border-zinc-200">
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
              className="max-h-72 object-contain mix-blend-multiply rounded-lg w-full h-full transition-transform hover:scale-105 duration-500"
            />
          </div>
          <div className="flex-1 p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 leading-tight">{main_product.name}</h1>
                {isLegacy && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold uppercase border border-amber-200">
                    <AlertTriangle className="w-3 h-3" /> Legacy Device
                  </span>
                )}
              </div>
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

      {/* THE STRATEGIST'S VERDICT (Refined Section) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight italic uppercase">The Strategist's Verdict</h2>
            </div>
            <div className="hidden sm:block">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                 Intent-Based Analysis
               </span>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            {user ? (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="text-4xl opacity-20 font-serif">“</span>
                  <p className="text-zinc-100 leading-relaxed text-lg italic font-medium -mt-2">
                    {suits_me_reason}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Durability Audit</span>
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-32 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isLegacy ? 'bg-red-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${main_product.durability}%` }}
                            />
                         </div>
                         <span className="font-mono font-bold text-sm">{main_product.durability}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Zap className="w-4 h-4 fill-indigo-400" />
                    SUITS ME RIGHT VERIFIED
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                  Sign in to unlock the full strategic audit, including long-term investment advice and durability scores.
                </p>
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3 rounded-full font-bold text-sm hover:bg-zinc-200 transition shadow-lg"
                >
                  Unlock Expert Analysis
                </Link>
              </div>
            )}
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </section>

      {/* STRATEGIC ALTERNATIVES (MARKET RIVALS) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
            Strategic Alternatives
          </h2>
          <span className="text-xs font-medium text-zinc-400 italic">Better value for your intent</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {main_product.competitors?.map((comp: any, idx: number) => (
            <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group flex flex-col h-full border-b-4 border-b-transparent hover:border-b-indigo-500">
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 flex-shrink-0 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100">
                   <ProductImage 
                      src={comp.image} 
                      alt={comp.name} 
                      className="w-full h-full object-contain p-2"
                    />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition truncate">{comp.name}</h3>
                  <p className="text-emerald-600 font-bold mb-1">{comp.price}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-zinc-500">{comp.stars} Rating</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <ul className="space-y-3 mb-6">
                  {comp.highlights?.map((h: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-600 flex items-start gap-2 leading-tight">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
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
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-xs font-bold transition shadow-md"
                    >
                      View Alternative <ExternalLink className="w-3 h-3" />
                    </a>
                 ) : (
                    <span className="flex items-center justify-center w-full py-2.5 bg-zinc-50 text-zinc-400 text-xs rounded-xl cursor-not-allowed">
                       Link Unavailable
                    </span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VENDOR DEALS */}
      {!isHistorical && main_product.new_deals && main_product.new_deals.length > 0 && (
        <section className="bg-zinc-100/50 p-8 rounded-3xl border border-dashed border-zinc-300">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 text-center">
                Live Market Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {main_product.new_deals.map((deal: any, i: number) => (
                <a 
                    key={i} 
                    href={deal.url} 
                    target="_blank" 
                    className="flex flex-col p-5 bg-white border border-zinc-200 rounded-2xl hover:shadow-lg hover:ring-2 hover:ring-indigo-500/20 transition group"
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{deal.vendor}</span>
                        <ShoppingBag className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition"/>
                    </div>
                    <span className="text-2xl font-black text-zinc-900 group-hover:text-indigo-600 transition">{deal.price}</span>
                    <span className="mt-3 text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                      Purchase Now <ExternalLink className="w-3 h-3" />
                    </span>
                </a>
                ))}
            </div>
        </section>
      )}

    </div>
  );
}