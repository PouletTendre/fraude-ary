"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
}

interface SymbolSearchProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  assetType?: "crypto" | "stocks" | "real_estate";
}

export function SymbolSearch({ value, onChange, error, assetType }: SymbolSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchSymbols = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchApi<SearchResult[]>(`/api/v1/assets/search/symbols?q=${encodeURIComponent(q)}`);
      setResults(data || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSymbols(newValue);
    }, 300);
  };

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setQuery(symbol);
    setIsOpen(false);
    setResults([]);
  };

  const handleUseCustom = () => {
    onChange(query.toUpperCase().trim());
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <label className="block text-sm font-medium text-text-secondary mb-1">
        Symbol
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { setIsOpen(true); if (query.length >= 1) searchSymbols(query); }}
          placeholder="Search any stock or crypto (e.g. AAPL, BTC)"
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-border-focus disabled:cursor-not-allowed disabled:opacity-50 bg-surface-sunken border-border text-text-primary pl-10",
            error && "border-red-500 focus:ring-red-500"
          )}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-surface-sunken py-1 shadow-lg">
          {results.length > 0 ? (
            results.map((item) => (
              <li
                key={item.symbol}
                onClick={() => handleSelect(item.symbol)}
                className="cursor-pointer px-4 py-2 hover:bg-surface-raised"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">{item.symbol}</span>
                  <span className="text-xs text-text-tertiary capitalize">{item.type}</span>
                </div>
                <p className="text-sm text-text-tertiary">{item.name} {item.exchange ? `(${item.exchange})` : ""}</p>
              </li>
            ))
          ) : query.length >= 1 && !loading ? (
            <li
              onClick={handleUseCustom}
              className="cursor-pointer px-4 py-3 hover:bg-surface-raised flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-primary">
                Use custom symbol "{query.toUpperCase().trim()}"
              </span>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
