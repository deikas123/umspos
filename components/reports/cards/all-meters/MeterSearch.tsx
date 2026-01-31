import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Loader2,
  X,
  Check,
  User,
  DollarSign,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { superSearchMeter } from "@/lib/actions/meters";
import { MeterStatusFilter } from "../../hooks/useMetersData";
import { formatDateShort } from "@/lib/utils/dateUtils";

interface CachedResult {
  timestamp: number;
  data: any;
}

const searchCache: { [key: string]: CachedResult } = {};
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

type MeterSearchProps = Readonly<{
  filters: {
    handleStatusFilterChange: (status: MeterStatusFilter) => void;
    handleSearchChange: (search: string) => void;
  };
}>;

export function MeterSearch({ filters }: MeterSearchProps) {
  const [searchInput, setSearchInput] = useState("");
  const [effectiveSearch, setEffectiveSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Add function to check and clean cache
  const cleanCache = useMemo(() => {
    return () => {
      const now = Date.now();
      Object.keys(searchCache).forEach((key) => {
        if (now - searchCache[key].timestamp > CACHE_DURATION) {
          delete searchCache[key];
        }
      });
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Apply the search filter directly
      filters.handleSearchChange(searchInput);
      setIsSearchOpen(false);
    } else if (e.key === "Escape") {
      // Clear search when Escape is pressed
      clearSearch();
    }
  };

  // Advanced search functionality
  useEffect(() => {
    const searchMeters = async () => {
      if (effectiveSearch.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearchLoading(true);
      try {
        // Clean old cache entries
        cleanCache();

        // Check cache first
        const cachedResult = searchCache[effectiveSearch];
        if (
          cachedResult &&
          Date.now() - cachedResult.timestamp < CACHE_DURATION
        ) {
          setSearchResults(cachedResult.data);
          setIsSearchLoading(false);
          return;
        }

        // If not in cache, fetch from API
        const results = await superSearchMeter(effectiveSearch);

        // Cache the results if meter is sold or with agent
        const shouldCache = results.some(
          (result: any) =>
            result.status === "sold" || result.status === "with_agent",
        );

        if (shouldCache) {
          searchCache[effectiveSearch] = {
            timestamp: Date.now(),
            data: results,
          };
        }

        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    };

    searchMeters();
  }, [effectiveSearch, cleanCache]);

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSearchInput(value);

    // Only update effective search if length is sufficient
    if (value.length >= 3 || value.length === 0) {
      setEffectiveSearch(value);
      setIsSearchOpen(value.length >= 3);
    }

    // If search is cleared, also clear the filter in useMetersData
    if (value.length === 0) {
      filters.handleSearchChange("");
    }
  };

  // Clear search and reset filters
  const clearSearch = () => {
    setSearchInput("");
    setEffectiveSearch("");
    setSearchResults([]);
    filters.handleSearchChange("");
    setIsSearchOpen(false);
  };

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderSearchResults = () => {
    if (isSearchLoading) {
      return (
        <div className='flex items-center justify-center py-4'>
          <Loader2 className='h-6 w-6 animate-spin text-primary' />
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className='text-center py-4 text-gray-500'>No meters found</div>
      );
    }

    return (
      <div className='space-y-2'>
        {searchResults.map((result: any) => (
          <button
            key={result.serial_number}
            type='button'
            className='flex flex-col w-full text-left p-3 hover:bg-gray-50 rounded-md gap-2 border-b last:border-0 cursor-pointer'
            onClick={() => {
              // Set the filter to match this meter's status
              filters.handleStatusFilterChange(
                result.status as MeterStatusFilter,
              );
              // Set search term to this meter's serial number
              filters.handleSearchChange(result.serial_number);
              setSearchInput(result.serial_number);
              setIsSearchOpen(false);
            }}>
            <div className='w-full'>
              <div className='font-medium text-primary flex items-center gap-2'>
                {result.serial_number}
                {result.status === "in_stock" && (
                  <Badge className='bg-green-500'>
                    <Check className='mr-1 h-3 w-3' />
                    In Stock
                  </Badge>
                )}
                {result.status === "with_agent" && (
                  <Badge className='bg-orange-500'>
                    <User className='mr-1 h-3 w-3' />
                    With Agent
                  </Badge>
                )}
                {result.status === "sold" && (
                  <Badge className='bg-blue-500'>
                    <DollarSign className='mr-1 h-3 w-3' />
                    Sold
                  </Badge>
                )}
                {result.status === "replaced" && (
                  <Badge className='bg-purple-500'>
                    <AlertCircle className='mr-1 h-3 w-3' />
                    Replaced
                  </Badge>
                )}
                {result.status === "faulty" && (
                  <Badge className='bg-red-500'>
                    <AlertTriangle className='mr-1 h-3 w-3' />
                    Faulty
                  </Badge>
                )}
              </div>
              {result.type && (
                <div className='text-sm text-gray-500 mt-1'>
                  Type: {result.type}
                </div>
              )}
              {result.status === "with_agent" && result.agent && (
                <div className='text-sm text-gray-500 mt-1'>
                  Agent: {result.agent.name}, {result.agent.location}
                </div>
              )}
              {(result.status === "sold" || result.status === "replaced") &&
                result.sale_details && (
                  <div className='text-sm text-gray-500 space-y-1 mt-2'>
                    <div>
                      Sold on: {formatDateShort(result.sale_details.sold_at)}
                    </div>
                    <div>Sold by: {result.sale_details.sold_by}</div>
                    <div>
                      To: {result.sale_details.recipient},{" "}
                      {result.sale_details.destination}
                    </div>
                  </div>
                )}
              {result.status === "faulty" && result.fault_details && (
                <div className='text-sm text-gray-500 space-y-1 mt-2'>
                  <div>Fault: {result.fault_details.fault_description}</div>
                  {result.fault_details.returned_at && (
                    <div>
                      Returned on:{" "}
                      {formatDateShort(result.fault_details.returned_at)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className='relative w-64' ref={searchRef}>
      <div className='relative w-full'>
        <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          type='text'
          placeholder='Search by serial number...'
          value={searchInput}
          onChange={handleSearchInputChange}
          onKeyDown={handleKeyDown}
          className='pl-8 pr-8 w-full bg-gray-50/50 border-gray-200 focus:bg-white transition-colors'
          onFocus={() => setIsSearchOpen(searchInput.length >= 3)}
        />
        {searchInput && (
          <button
            onClick={clearSearch}
            className='absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer'>
            <X className='h-4 w-4' />
          </button>
        )}
        {isSearchLoading && (
          <div className='absolute right-2 top-2.5'>
            <Loader2 className='h-4 w-4 animate-spin' />
          </div>
        )}
      </div>

      {/* Search Results Popover */}
      {isSearchOpen && searchInput.length >= 3 && (
        <div className='absolute mt-1 w-[350px] right-0 bg-white rounded-md border shadow-lg z-50'>
          <div className='max-h-[60vh] overflow-y-auto p-2'>
            {renderSearchResults()}
          </div>
        </div>
      )}
    </div>
  );
}
