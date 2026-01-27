'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function HistorySidebar({ onSelectProduct }: { onSelectProduct: (product: any) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('search_history')
          .select('*')
          .order('created_at', { ascending: false });
        setHistory(data || []);
      }
    };
    fetchHistory();
  }, [supabase]);

  return (
    <aside className="w-64 border-r border-white/10 h-screen overflow-y-auto p-4 hidden md:block bg-black">
      <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Recent Reports</h3>
      <div className="space-y-2">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectProduct(item)}
            className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10 group"
          >
            <p className="text-sm font-bold truncate group-hover:text-indigo-400">{item.product_name}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-gray-600">{new Date(item.created_at).toLocaleDateString()}</span>
              <span className="text-[10px] font-bold text-indigo-500/50">{item.durability_score}%</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
