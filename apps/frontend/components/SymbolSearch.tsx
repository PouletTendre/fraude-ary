"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { ASSET_TYPE_CONFIG, type AssetType } from "@/lib/asset-type-config";

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
  assetType?: "crypto" | "stocks" | "real_estate" | "etf";
}

const POPULAR_SUGGESTIONS: SearchResult[] = [
  { symbol: "AAPL", name: "Apple Inc.", type: "stocks", exchange: "NMS" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "stocks", exchange: "NMS" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stocks", exchange: "NMS" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", type: "stocks", exchange: "NMS" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "etf", exchange: "PCX" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "etf", exchange: "NMS" },
  { symbol: "BTC-USD", name: "Bitcoin USD", type: "crypto", exchange: "CCC" },
  { symbol: "ETH-USD", name: "Ethereum USD", type: "crypto", exchange: "CCC" },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "stocks", exchange: "NMS" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", type: "etf", exchange: "PCX" },
];

const DEBOUNCE_MS = 300;
const LISTBOX_ID = "symbol-search-listbox";
const INPUT_ID = "symbol-search-input";

export function SymbolSearch({ value, onChange, error, assetType }: SymbolSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const searchSymbols = useCallback(async (q: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (!q || q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const typeParam = assetType && assetType !== "real_estate" ? `&type=${assetType}` : "";
      const data = await fetchApi<SearchResult[]>(
        `/api/v1/assets/search/symbols?q=${encodeURIComponent(q)}${typeParam}`,
        { signal: controller.signal }
      );
      if (!controller.signal.aborted) {
        setResults(data || []);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [assetType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSymbols(newValue);
    }, DEBOUNCE_MS);
  };

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setQuery(symbol);
    setIsOpen(false);
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleUseCustom = () => {
    onChange(query.toUpperCase().trim());
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const displayResults = useMemo(() => {
    if (query.length >= 1) return results;
    if (assetType && assetType !== "real_estate") {
      return POPULAR_SUGGESTIONS.filter((s) => s.type === assetType).slice(0, 5);
    }
    return POPULAR_SUGGESTIONS;
  }, [query, results, assetType]);

  const showCustomOption = query.length >= 1 && !loading && !results.some(
    (r) => r.symbol.toUpperCase() === query.toUpperCase().trim()
  );

  const itemCount = displayResults.length + (showCustomOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1 >= itemCount ? 0 : prev + 1;
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1 < 0 ? itemCount - 1 : prev - 1;
          return next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < displayResults.length) {
          handleSelect(displayResults[activeIndex].symbol);
        } else if (showCustomOption && activeIndex === displayResults.length) {
          handleUseCustom();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const getOptionId = (index: number) => `symbol-search-option-${index}`;

  const getTypeIcon = (type: string) => {
    const config = ASSET_TYPE_CONFIG[type as AssetType];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className="w-3.5 h-3.5" />;
  };

  const getTypeBadge = (type: string) => {
    const config = ASSET_TYPE_CONFIG[type as AssetType];
    if (!config) return null;
    return (
      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", config.badgeClass)}>
        {getTypeIcon(type)}
        {config.label}
      </span>
    );
  };

  const selectedTypeConfig = assetType ? ASSET_TYPE_CONFIG[assetType as AssetType] : null;

  const activeDescendant = activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  return (
    <div ref={containerRef} className="w-full relative">
      <label htmlFor={INPUT_ID} className="block text-sm font-medium text-text-secondary mb-1">
        Symbole
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        {selectedTypeConfig && query && (
          <span className={cn(
            "absolute right-9 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            selectedTypeConfig.badgeClass
          )}>
            {(() => { const Icon = selectedTypeConfig.icon; return <Icon className="w-3 h-3" />; })()}
            {selectedTypeConfig.label}
          </span>
        )}
        <input
          id={INPUT_ID}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-owns={LISTBOX_ID}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant ?? ""}
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher une action, ETF ou crypto (ex: AAPL, BTC)"
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-border-focus disabled:cursor-not-allowed disabled:opacity-50 bg-surface-sunken border-border text-text-primary pl-10",
            selectedTypeConfig && query ? "pr-20" : "pr-10",
            error && "border-red-500 focus:ring-red-500"
          )}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={LISTBOX_ID}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-border bg-surface-sunken py-1 shadow-lg"
        >
          {query.length === 0 && (
            <li role="presentation" className="px-4 py-2 text-xs text-text-muted border-b border-border">
              Suggestions populaires
            </li>
          )}
          {displayResults.length > 0 ? (
            displayResults.map((item, index) => (
              <li
                key={item.symbol}
                id={getOptionId(index)}
                role="option"
                aria-selected={activeIndex === index}
                onClick={() => handleSelect(item.symbol)}
                className={cn(
                  "cursor-pointer px-4 py-2.5 hover:bg-surface-raised transition-colors",
                  activeIndex === index && "bg-surface-raised"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-text-primary">{item.symbol}</span>
                    {getTypeBadge(item.type)}
                  </div>
                  {item.exchange && (
                    <span className="text-[10px] text-text-muted">{item.exchange}</span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5 truncate">{item.name}</p>
              </li>
            ))
          ) : query.length >= 1 && !loading ? (
            showCustomOption && (
              <li
                id={getOptionId(0)}
                role="option"
                aria-selected={activeIndex === 0}
                onClick={handleUseCustom}
                className={cn(
                  "cursor-pointer px-4 py-3 hover:bg-surface-raised flex items-center gap-2",
                  activeIndex === 0 && "bg-surface-raised"
                )}
              >
                <Plus className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-primary">
                  Utiliser &quot;{query.toUpperCase().trim()}&quot;
                </span>
              </li>
            )
          ) : null}
        </ul>
      )}
    </div>
  );
}
