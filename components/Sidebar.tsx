'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function Sidebar({ onSelectHistory }: { onSelectHistory: (data: any) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('search_history')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setHistory(data);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 h-screen p-4 hidden md:flex flex-col">
      <h2 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-6">Search History</h2>
      <div className="space-y-2 overflow-y-auto">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectHistory(item.result)}
            className="w-full text-left p-3 rounded-xl hover:bg-white/5 text-sm text-zinc-300 truncate transition"
          >
            {item.product_name || item.query}
          </button>
        ))}
      </div>
    </div>
  );
}