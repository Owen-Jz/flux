'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FunnelIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterBarProps {
    searchPlaceholder?: string;
    filters: {
        name: string;
        label: string;
        options: FilterOption[];
    }[];
    activeFilters: Record<string, string>;
    onFilterChange: (filterName: string, value: string) => void;
    onSearch: (searchTerm: string) => void;
    onClear: () => void;
}

export function FilterBar({
    searchPlaceholder = 'Search...',
    filters,
    activeFilters,
    onFilterChange,
    onSearch,
    onClear,
}: FilterBarProps) {
    const [searchValue, setSearchValue] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState<string | null>(null);

    const hasActiveFilters = Object.values(activeFilters).some(Boolean) || searchValue;

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchValue);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
                {/* Search Input */}
                <div className="flex-1 max-w-md relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                </div>

                {/* Filter Buttons */}
                {filters.map((filter) => (
                    <div key={filter.name} className="relative">
                        <button
                            type="button"
                            onClick={() => setShowFilterDropdown(showFilterDropdown === filter.name ? null : filter.name)}
                            className={`flex items-center gap-2 px-4 py-3 bg-zinc-900 border ${
                                showFilterDropdown === filter.name
                                    ? 'border-violet-500/50'
                                    : activeFilters[filter.name]
                                    ? 'border-violet-500/30 bg-violet-500/10'
                                    : 'border-zinc-800'
                            } rounded-xl text-zinc-300 hover:border-zinc-700 transition-all`}
                        >
                            <FunnelIcon className="w-4 h-4" />
                            {filter.label}
                            {activeFilters[filter.name] && (
                                <span className="w-2 h-2 rounded-full bg-violet-500" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showFilterDropdown === filter.name && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl p-2 z-50 shadow-xl"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onFilterChange(filter.name, '');
                                            setShowFilterDropdown(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 rounded-lg transition-colors"
                                    >
                                        All {filter.label}
                                    </button>
                                    {filter.options.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                onFilterChange(filter.name, option.value);
                                                setShowFilterDropdown(null);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                                                activeFilters[filter.name] === option.value
                                                    ? 'bg-violet-500/20 text-violet-400'
                                                    : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {/* Search Button */}
                <button
                    type="submit"
                    className="px-4 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20"
                >
                    Search
                </button>

                {/* Clear Button */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchValue('');
                            onClear();
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </form>

            {/* Active Filter Tags */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 flex-wrap"
                    >
                        {searchValue && (
                            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-full flex items-center gap-1">
                                Search: {searchValue}
                            </span>
                        )}
                        {Object.entries(activeFilters).map(([name, value]) => {
                            const filter = filters.find((f) => f.name === name);
                            const option = filter?.options.find((o) => o.value === value);
                            if (!value || !option) return null;
                            return (
                                <span
                                    key={name}
                                    className="px-3 py-1 bg-violet-500/10 text-violet-400 text-sm rounded-full capitalize flex items-center gap-1"
                                >
                                    {filter?.label}: {option.label}
                                    <button
                                        onClick={() => onFilterChange(name, '')}
                                        className="ml-1 hover:text-violet-300"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </span>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}