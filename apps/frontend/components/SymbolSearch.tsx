"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const KNOWN_SYMBOLS = [
  // Stocks US - Tech
  { symbol: "AAPL", name: "Apple Inc.", type: "stocks" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stocks" },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "stocks" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "stocks" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "stocks" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "stocks" },
  { symbol: "NVDA", name: "NVIDIA Corp.", type: "stocks" },
  { symbol: "NFLX", name: "Netflix Inc.", type: "stocks" },
  { symbol: "CRM", name: "Salesforce Inc.", type: "stocks" },
  { symbol: "ADBE", name: "Adobe Inc.", type: "stocks" },
  { symbol: "INTC", name: "Intel Corp.", type: "stocks" },
  { symbol: "AMD", name: "AMD Inc.", type: "stocks" },
  { symbol: "ORCL", name: "Oracle Corp.", type: "stocks" },
  { symbol: "IBM", name: "IBM Corp.", type: "stocks" },
  { symbol: "CSCO", name: "Cisco Systems", type: "stocks" },
  { symbol: "QCOM", name: "Qualcomm Inc.", type: "stocks" },
  { symbol: "AVGO", name: "Broadcom Inc.", type: "stocks" },
  { symbol: "TXN", name: "Texas Instruments", type: "stocks" },
  { symbol: "PYPL", name: "PayPal Holdings", type: "stocks" },
  { symbol: "UBER", name: "Uber Technologies", type: "stocks" },
  // Stocks US - Finance
  { symbol: "JPM", name: "JPMorgan Chase", type: "stocks" },
  { symbol: "BAC", name: "Bank of America", type: "stocks" },
  { symbol: "WFC", name: "Wells Fargo", type: "stocks" },
  { symbol: "GS", name: "Goldman Sachs", type: "stocks" },
  { symbol: "MS", name: "Morgan Stanley", type: "stocks" },
  { symbol: "V", name: "Visa Inc.", type: "stocks" },
  { symbol: "MA", name: "Mastercard Inc.", type: "stocks" },
  { symbol: "AXP", name: "American Express", type: "stocks" },
  // Stocks US - Healthcare
  { symbol: "JNJ", name: "Johnson & Johnson", type: "stocks" },
  { symbol: "PFE", name: "Pfizer Inc.", type: "stocks" },
  { symbol: "MRK", name: "Merck & Co.", type: "stocks" },
  { symbol: "ABBV", name: "AbbVie Inc.", type: "stocks" },
  { symbol: "UNH", name: "UnitedHealth Group", type: "stocks" },
  { symbol: "LLY", name: "Eli Lilly", type: "stocks" },
  // Stocks US - Consumer
  { symbol: "WMT", name: "Walmart Inc.", type: "stocks" },
  { symbol: "COST", name: "Costco Wholesale", type: "stocks" },
  { symbol: "KO", name: "Coca-Cola Co.", type: "stocks" },
  { symbol: "PEP", name: "PepsiCo Inc.", type: "stocks" },
  { symbol: "MCD", name: "McDonald's Corp.", type: "stocks" },
  { symbol: "SBUX", name: "Starbucks Corp.", type: "stocks" },
  { symbol: "NKE", name: "Nike Inc.", type: "stocks" },
  { symbol: "DIS", name: "Walt Disney Co.", type: "stocks" },
  { symbol: "HD", name: "Home Depot", type: "stocks" },
  // Stocks US - Industrial
  { symbol: "BA", name: "Boeing Co.", type: "stocks" },
  { symbol: "CAT", name: "Caterpillar Inc.", type: "stocks" },
  { symbol: "GE", name: "General Electric", type: "stocks" },
  { symbol: "HON", name: "Honeywell", type: "stocks" },
  { symbol: "MMM", name: "3M Company", type: "stocks" },
  // Stocks US - Energy
  { symbol: "XOM", name: "Exxon Mobil", type: "stocks" },
  { symbol: "CVX", name: "Chevron Corp.", type: "stocks" },
  { symbol: "COP", name: "ConocoPhillips", type: "stocks" },
  // Meme / Trending
  { symbol: "GME", name: "GameStop Corp.", type: "stocks" },
  { symbol: "AMC", name: "AMC Entertainment", type: "stocks" },
  { symbol: "PLTR", name: "Palantir Tech", type: "stocks" },
  { symbol: "SNOW", name: "Snowflake Inc.", type: "stocks" },
  { symbol: "ZM", name: "Zoom Video", type: "stocks" },
  { symbol: "SHOP", name: "Shopify Inc.", type: "stocks" },
  { symbol: "ABNB", name: "Airbnb Inc.", type: "stocks" },
  { symbol: "COIN", name: "Coinbase Global", type: "stocks" },
  { symbol: "SQ", name: "Block Inc.", type: "stocks" },
  { symbol: "ROKU", name: "Roku Inc.", type: "stocks" },
  // Crypto
  { symbol: "BTC", name: "Bitcoin", type: "crypto" },
  { symbol: "ETH", name: "Ethereum", type: "crypto" },
  { symbol: "SOL", name: "Solana", type: "crypto" },
  { symbol: "DOGE", name: "Dogecoin", type: "crypto" },
  { symbol: "ADA", name: "Cardano", type: "crypto" },
  { symbol: "XRP", name: "XRP", type: "crypto" },
  { symbol: "DOT", name: "Polkadot", type: "crypto" },
  { symbol: "MATIC", name: "Polygon", type: "crypto" },
  { symbol: "AVAX", name: "Avalanche", type: "crypto" },
  { symbol: "LINK", name: "Chainlink", type: "crypto" },
  { symbol: "UNI", name: "Uniswap", type: "crypto" },
  { symbol: "LTC", name: "Litecoin", type: "crypto" },
  { symbol: "BCH", name: "Bitcoin Cash", type: "crypto" },
  { symbol: "ETC", name: "Ethereum Classic", type: "crypto" },
  { symbol: "XLM", name: "Stellar", type: "crypto" },
  { symbol: "VET", name: "VeChain", type: "crypto" },
  { symbol: "FIL", name: "Filecoin", type: "crypto" },
  { symbol: "TRX", name: "TRON", type: "crypto" },
  { symbol: "ALGO", name: "Algorand", type: "crypto" },
  { symbol: "ATOM", name: "Cosmos", type: "crypto" },
  // Real Estate - Cities
  { symbol: "PARIS", name: "Paris, France", type: "real_estate" },
  { symbol: "LYON", name: "Lyon, France", type: "real_estate" },
  { symbol: "MARSEILLE", name: "Marseille, France", type: "real_estate" },
  { symbol: "BORDEAUX", name: "Bordeaux, France", type: "real_estate" },
  { symbol: "NICE", name: "Nice, France", type: "real_estate" },
  { symbol: "LONDON", name: "London, UK", type: "real_estate" },
  { symbol: "NEWYORK", name: "New York, USA", type: "real_estate" },
  { symbol: "MIAMI", name: "Miami, USA", type: "real_estate" },
  { symbol: "TOKYO", name: "Tokyo, Japan", type: "real_estate" },
  { symbol: "DUBAI", name: "Dubai, UAE", type: "real_estate" },
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

  const handleUseCustom = () => {
    onChange(query.toUpperCase());
    setIsOpen(false);
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
          placeholder="Search or type any symbol (e.g. BTC, AAPL)"
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 pl-10",
            error && "border-red-500 focus:ring-red-500"
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((item) => (
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
            ))
          ) : query.length >= 1 ? (
            <li
              onClick={handleUseCustom}
              className="cursor-pointer px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Use custom symbol "{query.toUpperCase()}"
              </span>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
