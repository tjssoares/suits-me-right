'use client';

import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  query: string;
  setQuery: (val: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export default function SearchBar({ query, setQuery, onSearch, isLoading }: SearchBarProps) {
  
  // Allow searching by pressing "Enter"
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative group">
        {/* Glow effect on hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[22px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative flex items-center bg-white border border-zinc-200 rounded-[20px] p-2 shadow-xl">
          <div className="flex items-center flex-1 px-4">
            <Search className="w-5 h-5 text-zinc-400 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a product name or URL (e.g. Sony WH-1000XM5)..."
              className="w-full bg-transparent border-none focus:ring-0 text-zinc-800 placeholder-zinc-400 text-lg py-3 outline-none"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={onSearch}
            disabled={isLoading || !query.trim()}
            className={`
              flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all
              ${isLoading 
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
                : 'bg-zinc-900 text-white hover:bg-black active:scale-95 shadow-lg shadow-indigo-200'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>
      
      {/* Search hints */}
      <div className="mt-4 flex gap-4 justify-center">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Try searching:</span>
        <button 
          onClick={() => setQuery("MacBook Pro M3")}
          className="text-[10px] font-bold text-indigo-500 hover:underline uppercase"
        >
          MacBook Pro M3
        </button>
        <button 
          onClick={() => setQuery("Dyson V15 Detect")}
          className="text-[10px] font-bold text-indigo-500 hover:underline uppercase"
        >
          Dyson V15
        </button>
      </div>
    </div>
  );
}