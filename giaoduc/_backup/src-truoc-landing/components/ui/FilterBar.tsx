import React, { useState, useEffect } from 'react';
import { Filter, X, Check, Search } from 'lucide-react';

import Portal from './Portal';
export type FilterField = {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date_range';
  fromKey?: string;
  toKey?: string;
  options?: { value: string; label: string }[];
};

export type ActiveFilter = {
  id: string;
  field: string;
  operator: string;
  value: string;
  label?: string;
};

interface FilterBarProps {
  fields: FilterField[];
  activeFilters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ fields, activeFilters, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const textFields = fields.filter(f => f.type === 'text');
  const selectFields = fields.filter(f => f.type === 'select');
  const dateRangeFields = fields.filter(f => f.type === 'date_range');

  // Handle Search Input (Assuming only one text field for simplicity)
  const searchField = textFields[0];
  
  useEffect(() => {
    if (searchField) {
      const activeSearch = activeFilters.find(f => f.field === searchField.key);
      if (!activeSearch && localSearch) {
        setLocalSearch(''); // Clear local search if removed from outside
      } else if (activeSearch && activeSearch.value !== localSearch) {
        setLocalSearch(activeSearch.value);
      }
    }
  }, [activeFilters, searchField]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchField) return;

    let newFilters = activeFilters.filter(f => f.field !== searchField.key);
    if (localSearch.trim()) {
      newFilters.push({
        id: Math.random().toString(36).substr(2, 9),
        field: searchField.key,
        operator: 'contains',
        value: localSearch.trim(),
        label: localSearch.trim()
      });
    }
    onChange(newFilters);
  };

  const toggleSelectFilter = (field: FilterField, optValue: string, optLabel: string) => {
    const existing = activeFilters.find(f => f.field === field.key && f.value === optValue);
    if (existing) {
      onChange(activeFilters.filter(f => f.id !== existing.id));
    } else {
      onChange([
        ...activeFilters,
        {
          id: Math.random().toString(36).substr(2, 9),
          field: field.key,
          operator: 'equals',
          value: optValue,
          label: optLabel
        }
      ]);
    }
  };

  const clearAllSelectFilters = () => {
    const newFilters = activeFilters.filter(f => {
      const fieldConfig = fields.find(config => config.key === f.field);
      return fieldConfig?.type !== 'select';
    });
    onChange(newFilters);
  };

  const activeSelectCount = activeFilters.filter(f => {
    const fieldConfig = fields.find(config => config.key === f.field || config.fromKey === f.field || config.toKey === f.field);
    return fieldConfig?.type === 'select' || fieldConfig?.type === 'date_range';
  }).length;

  const setDateRange = (field: FilterField, fromOrTo: 'from' | 'to', val: string) => {
    const key = fromOrTo === 'from' ? field.fromKey! : field.toKey!;
    const existing = activeFilters.find(f => f.field === key);
    let newFilters = activeFilters.filter(f => f.field !== key);
    if (val) {
      newFilters.push({
        id: Math.random().toString(36).substr(2, 9),
        field: key,
        operator: 'equals',
        value: val,
        label: `${fromOrTo === 'from' ? 'Từ' : 'Đến'} ${val}`
      });
    }
    onChange(newFilters);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Bar: Search & Filter Button */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        {searchField && (
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-cam transition-colors" />
            </div>
            <input
              type="text"
              placeholder={`Tìm kiếm theo ${searchField.label.toLowerCase()}...`}
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onBlur={handleSearchSubmit}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white dark:bg-night-elevated dark:hover:bg-night-elevated/80 border-2 border-transparent focus:border-cam rounded-xl outline-none transition-all duration-300 dark:text-white font-medium"
            />
          </form>
        )}
        
        {(selectFields.length > 0 || dateRangeFields.length > 0) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-night-surface border-2 border-gray-200 dark:border-night-border hover:border-cam dark:hover:border-cam rounded-xl font-bold text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
          >
            <Filter size={18} />
            Bộ lọc {activeSelectCount > 0 && <span className="bg-cam text-white text-xs px-2 py-0.5 rounded-full">{activeSelectCount}</span>}
          </button>
        )}
      </div>

      {/* Filter Modal Overlay */}
      {isModalOpen && (
        <Portal><div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-night-surface w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-night-border">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">Bộ lọc nâng cao</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-night-elevated dark:hover:bg-night-elevated/80 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              
              {/* Date Range Fields */}
              {dateRangeFields.map(field => {
                const fromVal = activeFilters.find(f => f.field === field.fromKey)?.value || '';
                const toVal = activeFilters.find(f => f.field === field.toKey)?.value || '';
                
                return (
                  <div key={field.key} className="flex flex-col gap-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {field.label}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Từ ngày (dd/mm/yyyy)</label>
                        <input
                          type="date"
                          value={fromVal}
                          onChange={(e) => setDateRange(field, 'from', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-night-elevated border-2 border-transparent focus:border-cam rounded-xl outline-none text-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Đến ngày (dd/mm/yyyy)</label>
                        <input
                          type="date"
                          value={toVal}
                          onChange={(e) => setDateRange(field, 'to', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-night-elevated border-2 border-transparent focus:border-cam rounded-xl outline-none text-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Select Fields */}
              {selectFields.map(field => (
                <div key={field.key} className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {field.label}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {field.options?.map(opt => {
                      const isActive = activeFilters.some(f => f.field === field.key && f.value === opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleSelectFilter(field, opt.value, opt.label)}
                          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border-2 transition-all font-medium text-sm ${
                            isActive 
                              ? 'border-cam text-cam bg-cam/5 dark:bg-cam/10 shadow-[0_0_0_2px_rgba(249,115,22,0.1)]' 
                              : 'border-gray-200 dark:border-night-border text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-night-elevated'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isActive ? 'border-cam bg-cam' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isActive && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-surface flex items-center gap-4">
              <button
                onClick={clearAllSelectFilters}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-night-elevated transition-colors"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-cam hover:bg-camDam text-white font-bold rounded-xl shadow-lg shadow-cam/30 transition-all text-center"
              >
                {activeSelectCount > 0 ? `Áp dụng ${activeSelectCount} bộ lọc` : 'Đóng'}
              </button>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  );
};

