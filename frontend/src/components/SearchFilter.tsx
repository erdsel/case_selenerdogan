import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import './SearchFilter.css';

export interface FilterState {
  searchTerm: string;
  selectedMachines: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

interface SearchFilterProps {
  machineIds: string[];
  onFilterChange: (filters: FilterState) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  machineIds,
  onFilterChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedMachines: [],
    dateRange: {
      start: '',
      end: '',
    },
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ searchTerm: e.target.value });
  };

  const handleMachineToggle = (machineId: string) => {
    const selectedMachines = filters.selectedMachines.includes(machineId)
      ? filters.selectedMachines.filter(id => id !== machineId)
      : [...filters.selectedMachines, machineId];
    updateFilters({ selectedMachines });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    updateFilters({
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      searchTerm: '',
      selectedMachines: [],
      dateRange: { start: '', end: '' },
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = 
    filters.searchTerm || 
    filters.selectedMachines.length > 0 || 
    filters.dateRange.start || 
    filters.dateRange.end;

  return (
    <div className="search-filter">
      <div className="search-filter-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search work orders..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {filters.searchTerm && (
              <button
                className="clear-search"
                onClick={() => updateFilters({ searchTerm: '' })}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls">
          {hasActiveFilters && (
            <button className="clear-all" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      <div className="filter-panel">
          <div className="filter-section">
            <h4>Machines</h4>
            <div className="machine-filters">
              {machineIds.map(machineId => (
                <label key={machineId} className="machine-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.selectedMachines.includes(machineId)}
                    onChange={() => handleMachineToggle(machineId)}
                  />
                  <span className="checkmark"></span>
                  {machineId}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4>Date Range</h4>
            <div className="date-range">
              <div className="date-input-group">
                <label>From:</label>
                <input
                  type="datetime-local"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>To:</label>
                <input
                  type="datetime-local"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};