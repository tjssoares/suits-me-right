'use client';
import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function Sidebar({ onSelectHistory }: { onSelectHistory: (data: any) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Function to fetch history from the DB
  const fetchHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) setHistory(data);
    }
  }, [supabase]);

  useEffect(() => {
    fetchHistory();

    // 2. REALTIME: Listen for new searches being added to the database
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'search_history' },
        (payload) => {
          // Add the new search to the top of the list instantly
          setHistory((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHistory]);

  // 3. Handle clicking a history item (with Price Refresh logic)
  const handleSelect = async (item: any) => {
    setLoading(true);
    
    // First, show the cached data so the UI is fast
    onSelectHistory(item.result);

    try {
      // Optional: Trigger a silent refresh for live prices if you have the endpoint
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productQuery: item.product_name, isRefresh: true }),
      });
      
      if (res.ok) {
        const freshData = await res.json();
        onSelectHistory(freshData); // Update UI with fresh prices
      }
    } catch (e) {
      console.log("Showing cached data; live price refresh failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-72 bg-zinc-950 border-r border-zinc-800 h-screen p-4 hidden md:flex flex-col">
      <div className="mb-8 px-2">
        <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
          Personal Research
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {history.length === 0 ? (
          <p className="text-zinc-600 text-xs px-2 italic">No recent searches...</p>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              disabled={loading}
              className="w-full text-left group p-3 rounded-xl hover:bg-white/5 transition-all duration-200"
            >
              <p className="text-sm text-zinc-300 font-medium truncate group-hover:text-white">
                {item.product_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-600">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                {item.durability_score > 0 && (
                  <span className="text-[10px] text-emerald-500/70">
                    {item.durability_score}/100 Durability
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {loading && (
        <div className="mt-4 px-2">
          <p className="text-[10px] text-blue-400 animate-pulse font-bold uppercase">Refreshing Prices...</p>
        </div>
      )}
    </div>
  );
}