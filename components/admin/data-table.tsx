'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column[];
    data: T[];
    keyField: keyof T;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    keyField,
    onRowClick,
    emptyMessage = 'No data available',
}: DataTableProps<T>) {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: Column) => {
        if (!column.sortable) return;

        if (sortColumn === column.key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column.key);
            setSortDirection('asc');
        }
    };

    const sortedData = sortColumn
        ? [...data].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            const cmp = aVal < bVal ? -1 : 1;
            return sortDirection === 'asc' ? cmp : -cmp;
        })
        : data;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-zinc-800/50 border-b border-zinc-800">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider ${
                                        column.sortable ? 'cursor-pointer hover:text-zinc-300 transition-colors' : ''
                                    }`}
                                    style={{ width: column.width }}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.label}
                                        {column.sortable && sortColumn === column.key && (
                                            <span className="text-violet-400">
                                                {sortDirection === 'asc' ? (
                                                    <ChevronUpIcon className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDownIcon className="w-4 h-4" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-zinc-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((row, index) => (
                                <motion.tr
                                    key={String(row[keyField])}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`hover:bg-zinc-800/30 transition-colors ${
                                        onRowClick ? 'cursor-pointer' : ''
                                    }`}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4 text-sm text-zinc-300">
                                            {row[column.key] !== undefined ? row[column.key] : '-'}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}