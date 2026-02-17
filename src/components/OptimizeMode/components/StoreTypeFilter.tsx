import React, { useMemo, useState, useEffect } from 'react';
import { Filter } from 'lucide-react';

/**
 * Categorize a store based on its Groups column value.
 *
 * Groups is semicolon-separated, e.g.:
 *   "IT - Italy; Presence Management (Triumph Stores); Triumph Stores"
 *   "IT - Italy; Store Locator (Triumph Stores & WHS partners)"
 *   "Triumph Partner Stores; HU - Hungary; Sloggi Partner Stores"
 *
 * Logic (applied to individual group entries split by ";"):
 * - "Partner Stores": has an entry matching "...Partner Stores" (e.g. "Triumph Partner Stores", "Sloggi Partner Stores")
 * - "Triumph Stores": has an entry containing "Triumph Stores" (standalone or inside locator/presence names)
 * - "Other": neither of the above
 */
export function categorizeStoreType(groups: string | undefined | null): string {
  if (!groups) return 'Other';
  const entries = groups.split(';').map(s => s.trim().toLowerCase());
  // Partner: dedicated "...Partner Stores" group entry (not "WHS partners" inside a locator name)
  if (entries.some(e => /partner\s+stores/.test(e))) return 'Partner Stores';
  // Own store: "Triumph Stores" appears as entry or inside a group name
  if (entries.some(e => /triumph\s+stores/.test(e))) return 'Triumph Stores';
  return 'Other';
}

interface StoreTypeFilterProps {
  rows: any[];
  groupsColumnKey: string;
  onFilterChange: (selectedTypes: Set<string>) => void;
  disabled?: boolean;
}

const StoreTypeFilter: React.FC<StoreTypeFilterProps> = ({
  rows,
  groupsColumnKey,
  onFilterChange,
  disabled = false,
}) => {
  // Compute category counts from rows
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const groups = String(row[groupsColumnKey] ?? '').trim() || undefined;
      const type = categorizeStoreType(groups);
      counts.set(type, (counts.get(type) || 0) + 1);
    }
    return counts;
  }, [rows, groupsColumnKey]);

  // Sorted category list for stable rendering
  const categories = useMemo(() => {
    const order = ['Triumph Stores', 'Partner Stores', 'Other'];
    return order.filter(c => categoryCounts.has(c));
  }, [categoryCounts]);

  // All selected by default
  const [selected, setSelected] = useState<Set<string>>(() => new Set(categories));

  // Sync selection when categories change (e.g. new file uploaded)
  useEffect(() => {
    const newSelected = new Set(categories);
    setSelected(newSelected);
    onFilterChange(newSelected);
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (category: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        // Don't allow deselecting all
        if (next.size <= 1) return prev;
        next.delete(category);
      } else {
        next.add(category);
      }
      onFilterChange(next);
      return next;
    });
  };

  if (categories.length <= 1) return null; // No point showing filter with only one type

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Filter className="w-5 h-5 text-purple-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-purple-900 mb-1">
            Store Type Filter (Optional)
          </h3>
          <p className="text-xs text-purple-700 mb-3">
            Select which store types to process. Deselected types will be skipped entirely.
          </p>

          <div className="flex flex-col gap-2">
            {categories.map(category => {
              const count = categoryCounts.get(category) || 0;
              const isChecked = selected.has(category);
              return (
                <label
                  key={category}
                  className={`flex items-center gap-2 cursor-pointer select-none ${
                    disabled ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(category)}
                    disabled={disabled}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-purple-900">
                    {category}{' '}
                    <span className="text-purple-600 font-mono text-xs">({count})</span>
                  </span>
                </label>
              );
            })}
          </div>

          {selected.size < categories.length && (
            <p className="mt-2 text-xs text-purple-600">
              {Array.from(selected).join(', ')} selected &mdash;{' '}
              {rows.length - Array.from(selected).reduce((sum, cat) => sum + (categoryCounts.get(cat) || 0), 0)} rows will be skipped
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreTypeFilter;
