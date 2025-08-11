import { useState, useEffect, useRef } from "react";
import { Search, Command } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type ClientWithCodes } from "@shared/schema";

interface SearchBarProps {
  onResults: (results: ClientWithCodes[]) => void;
  onClear: () => void;
}

export default function SearchBar({ onResults, onClear }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const onResultsRef = useRef(onResults);
  const onClearRef = useRef(onClear);

  // Update refs when props change
  useEffect(() => {
    onResultsRef.current = onResults;
    onClearRef.current = onClear;
  });

  // Debounce the query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults } = useQuery({
    queryKey: ["/api/clients/search", debouncedQuery],
    enabled: debouncedQuery.length > 2,
    queryFn: async () => {
      const response = await fetch(`/api/clients/search/${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json() as Promise<ClientWithCodes[]>;
    },
  });

  // Handle search results and clear
  useEffect(() => {
    if (debouncedQuery.length === 0) {
      onClearRef.current();
    } else if (searchResults && debouncedQuery.length > 2) {
      onResultsRef.current(searchResults);
    }
  }, [searchResults, debouncedQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative flex-1 max-w-2xl">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>
      <input
        id="search-input"
        type="text"
        placeholder="Search by name, phone, or payment code..."
        className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="absolute right-2 top-2">
        <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded flex items-center gap-1">
          <Command className="w-3 h-3" />
          K
        </kbd>
      </div>
    </div>
  );
}