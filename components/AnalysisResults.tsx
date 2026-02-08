"use client";

import React from "react";

export default function AnalysisResults({ results }: { results: any }) {
  if (!results) return null;

  return (
    <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm border border-zinc-200">
      <h2 className="text-2xl font-bold text-zinc-800 mb-2">
        {results.main_product?.name}
      </h2>
      <p className="text-zinc-600 mb-4">
        {results.main_product?.public_summary}
      </p>
      
      <div className="bg-zinc-900 text-white p-4 rounded-xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">
          AI Verdict
        </h3>
        <p>{results.suits_me_reason}</p>
      </div>
    </div>
  );
}