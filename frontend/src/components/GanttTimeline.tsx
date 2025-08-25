import React, { useMemo, useState } from 'react';
import { parseISO, min, max, subHours, addHours } from 'date-fns';
import { TimelineAxis } from './TimelineAxis';
import { MachineLane } from './MachineLane';
import { SearchFilter, FilterState } from './SearchFilter';
import { TimelineControls, TimelineSettings } from './TimelineControls';
import { useTimelineData } from '../hooks/useWorkOrders';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { clearHighlight } from '../store/slices/timelineSlice';
import './GanttTimeline.css';

interface GanttTimelineProps {
  className?: string;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const { data: timelineData, isLoading, error, refetch } = useTimelineData();
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedMachines: [],
    dateRange: { start: '', end: '' }
  });

  const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>({
    scale: 'hourly',
    zoom: 1.4, // Fixed at 140%
    gridSnap: true
  });

  const timelineBounds = useMemo(() => {
    if (!timelineData || !timelineData.operations.length) {
      // Default timeline if no data
      const now = new Date();
      return {
        start: subHours(now, 2),
        end: addHours(now, 6),
      };
    }

    const allTimes = timelineData.operations.flatMap(op => [
      parseISO(op.start),
      parseISO(op.end)
    ]);

    const minTime = min(allTimes);
    const maxTime = max(allTimes);

    // Add some padding to the timeline
    return {
      start: subHours(minTime, 1),
      end: addHours(maxTime, 1),
    };
  }, [timelineData]);

  const handleClearSelection = () => {
    dispatch(clearHighlight());
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleTimelineSettingsChange = (newSettings: TimelineSettings) => {
    // Ensure zoom always stays at 1.4
    setTimelineSettings({ ...newSettings, zoom: 1.4 });
  };

  // Filter timeline data based on current filters
  const filteredTimelineData = useMemo(() => {
    if (!timelineData) return null;

    let filteredWorkOrders = timelineData.work_orders;
    let filteredOperations = timelineData.operations;
    let filteredMachines = { ...timelineData.machines };

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredWorkOrders = filteredWorkOrders.filter(wo =>
        wo.id.toLowerCase().includes(searchLower) ||
        wo.product.toLowerCase().includes(searchLower)
      );
      const filteredWorkOrderIds = new Set(filteredWorkOrders.map(wo => wo.id));
      filteredOperations = filteredOperations.filter(op =>
        filteredWorkOrderIds.has(op.work_order_id)
      );
    }

    // Filter by machine selection
    if (filters.selectedMachines.length > 0) {
      filteredOperations = filteredOperations.filter(op =>
        filters.selectedMachines.includes(op.machine_id)
      );
      
      // Update machines object
      filteredMachines = {};
      filters.selectedMachines.forEach(machineId => {
        if (timelineData.machines[machineId]) {
          filteredMachines[machineId] = timelineData.machines[machineId].filter(op =>
            filteredOperations.some(filteredOp => filteredOp.id === op.id)
          );
        }
      });
    }

    // Filter by date range
    if (filters.dateRange.start || filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
      
      filteredOperations = filteredOperations.filter(op => {
        const opStart = parseISO(op.start);
        const opEnd = parseISO(op.end);
        
        if (startDate && opEnd < startDate) return false;
        if (endDate && opStart > endDate) return false;
        return true;
      });

      // Update machines object for date filtering
      Object.keys(filteredMachines).forEach(machineId => {
        filteredMachines[machineId] = filteredMachines[machineId].filter(op =>
          filteredOperations.some(filteredOp => filteredOp.id === op.id)
        );
      });
    }

    const activeMachineIds = Object.keys(filteredMachines).filter(
      machineId => filteredMachines[machineId].length > 0
    );

    return {
      ...timelineData,
      work_orders: filteredWorkOrders,
      operations: filteredOperations,
      machines: filteredMachines,
      machine_ids: activeMachineIds,
    };
  }, [timelineData, filters]);

  // Calculate timeline width based on zoom and scale
  const baseWidth = useMemo(() => {
    switch (timelineSettings.scale) {
      case 'hourly':
        return 1200;
      case 'daily':
        return 800;
      case 'weekly':
        return 600;
      default:
        return 1200;
    }
  }, [timelineSettings.scale]);

  const timelineWidth = useMemo(() => {
    return Math.round(baseWidth * 1.4); // Fixed zoom at 140%
  }, [baseWidth]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading timeline data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-title">Failed to load timeline data</div>
        <div className="error-message">Please check your connection and try again</div>
        <button onClick={() => refetch()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!timelineData || !timelineData.machine_ids.length) {
    return (
      <div className="error-container">
        <div className="error-icon">📋</div>
        <div className="error-title">No work orders found</div>
        <div className="error-message">Add some work orders to see the timeline</div>
      </div>
    );
  }

  const displayData = filteredTimelineData || timelineData;

  return (
    <div className="gantt-timeline">
      {/* Header */}
      <div className="timeline-header">
        <div className="header-content">
          <h2 className="timeline-title">Factory Work Orders Timeline</h2>
          <div className="header-controls">
            <div className="timeline-stats">
              {displayData.work_orders.length} work orders • {displayData.machine_ids.length} machines
              {filteredTimelineData && (
                <span className="filter-indicator"> (filtered)</span>
              )}
            </div>
            <button
              onClick={() => refetch()}
              className="refresh-btn"
              title="Refresh timeline"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        machineIds={timelineData.machine_ids}
        onFilterChange={handleFilterChange}
      />

      {/* Timeline Customization Controls */}
      <TimelineControls
        settings={timelineSettings}
        onSettingsChange={handleTimelineSettingsChange}
      />

      {/* Legend */}
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-color normal"></div>
          <span>Normal Operation</span>
        </div>
        <div className="legend-item">
          <div className="legend-color highlighted"></div>
          <span>Highlighted Work Order</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Selected Operation</span>
        </div>
        
      </div>

      {/* Timeline container */}
      <div className="timeline-content">
        <div className="timeline-wrapper" style={{ width: timelineWidth, minWidth: '100%' }}>
          {/* Timeline axis */}
          <TimelineAxis
            startTime={timelineBounds.start}
            endTime={timelineBounds.end}
            width={timelineWidth}
            height={40}
          />

          {/* Machine lanes */}
          <div className="timeline-lanes">
            {displayData.machine_ids.map((machineId) => {
              const machineOperations = displayData.machines[machineId] || [];
              const enrichedOperations = machineOperations.map(op => {
                const workOrder = displayData.work_orders.find(wo => wo.id === op.work_order_id);
                return {
                  ...op,
                  work_order_product: workOrder?.product || 'Unknown Product'
                };
              });

              return (
                <MachineLane
                  key={machineId}
                  machineId={machineId}
                  operations={enrichedOperations}
                  timelineStart={timelineBounds.start}
                  timelineEnd={timelineBounds.end}
                  width={timelineWidth}
                  onClearSelection={handleClearSelection}
                  allOperations={timelineData.operations} // Use full data for validation
                  workOrders={timelineData.work_orders} // Use full data for validation
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Clear selection hint */}
      <div className="timeline-hints">
        💡 Click on any operation to highlight all operations in the same work order. 
        🖱️ Drag operations to reschedule them across machines and time slots.
        Click on empty space or the same operation again to clear the selection.
      </div>
    </div>
  );
};