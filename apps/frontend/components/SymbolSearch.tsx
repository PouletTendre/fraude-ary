"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const KNOWN_SYMBOLS = [
  // Stocks
  { symbol: "AAPL", name: "Apple Inc.", type: "stocks" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stocks" },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "stocks" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "stocks" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "stocks" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "stocks" },
  { symbol: "NVDA", name: "NVIDIA Corp.", type: "stocks" },
  { symbol: "GME", name: "GameStop Corp.", type: "stocks" },
  // Crypto
  { symbol: "BTC", name: "Bitcoin", type: "crypto" },
  { symbol: "ETH", name: "Ethereum", type: "crypto" },
  { symbol: "SOL", name: "Solana", type: "crypto" },
  { symbol: "DOGE", name: "Dogecoin", type: "crypto" },
  { symbol: "ADA", name: "Cardano", type: "crypto" },
  { symbol: "XRP", name: "XRP", type: "crypto" },
];

interface SymbolSearchProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  assetType?: "crypto" | "stocks" | "real_estate";
}

export function SymbolSearch({ value, onChange, error, assetType }: SymbolSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const filteredSymbols = KNOWN_SYMBOLS.filter((item) => {
    const matchesType = !assetType || assetType === "all" || item.type === assetType;
    const matchesQuery =
      item.symbol.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setQuery(symbol);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Symbol
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search symbol (e.g. BTC, AAPL)..."
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 pl-10",
            error && "border-red-500 focus:ring-red-500"
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {isOpen && filteredSymbols.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {filteredSymbols.map((item) => (
            <li
              key={item.symbol}
              onClick={() => handleSelect(item.symbol)}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.symbol}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.type}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
