import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { Operation } from '../types';
import { DRAG_TYPES, DraggedOperation } from '../types/dragDrop';
import { formatTime, formatDuration } from '../utils/timeUtils';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setHighlightedWorkOrder, setSelectedOperation } from '../store/slices/timelineSlice';
import './OperationBar.css';

interface OperationBarProps {
  operation: Operation;
  left: number;
  width: number;
  isHighlighted: boolean;
  isSelected: boolean;
  workOrderProduct: string;
  onClick: () => void;
  timelineStart?: Date;
  timelineEnd?: Date;
  timelineWidth?: number;
}

export const OperationBar: React.FC<OperationBarProps> = ({
  operation,
  left,
  width,
  isHighlighted,
  isSelected,
  workOrderProduct,
  onClick,
  timelineStart,
  timelineEnd,
  timelineWidth,
}) => {
  // Setup drag functionality
  const [{ isDragging }, dragRef] = useDrag<DraggedOperation, void, { isDragging: boolean }>({
    type: DRAG_TYPES.OPERATION,
    item: () => ({
      operation,
      originalLeft: left,
      originalWidth: width,
    }),
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const getBarClass = () => {
    let baseClass = 'operation-bar';
    
    if (isDragging) {
      baseClass += ' dragging';
    } else if (isSelected) {
      baseClass += ' selected';
    } else if (isHighlighted) {
      baseClass += ' highlighted';
    } else {
      baseClass += ' normal';
    }
    
    return baseClass;
  };

  const displayName = `${operation.work_order_id} · ${operation.name}`;
  const duration = formatDuration(operation.start, operation.end);
  const startTime = formatTime(operation.start);
  const endTime = formatTime(operation.end);

  return (
    <div
      ref={dragRef as any}
      className={getBarClass()}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 40)}px`, // Minimum width for visibility
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onClick={handleClick}
      title={`${displayName}\n${startTime} - ${endTime} (${duration})\nProduct: ${workOrderProduct}\n\n🖱️ Click to select, drag to reschedule`}
    >
      <div className="operation-content">
        <span>{displayName}</span>
      </div>
      
      {/* Tooltip */}
      <div className="operation-tooltip">
        <div className="tooltip-title">{displayName}</div>
        <div className="tooltip-detail">Product: {workOrderProduct}</div>
        <div className="tooltip-detail">{startTime} - {endTime}</div>
        <div className="tooltip-detail">Duration: {duration}</div>
        <div className="tooltip-detail">Machine: {operation.machine_id}</div>
        
        {/* Arrow */}
        <div className="tooltip-arrow"></div>
      </div>
    </div>
  );
};