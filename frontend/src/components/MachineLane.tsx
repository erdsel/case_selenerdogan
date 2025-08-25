import React, { useState, useRef, useMemo } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { Operation } from '../types';
import { DRAG_TYPES, DraggedOperation } from '../types/dragDrop';
import { OperationBar } from './OperationBar';
import { ErrorModal } from './ErrorModal';
import { getTimelinePosition, getOperationWidth } from '../utils/timeUtils';
import { calculateNewOperationTimes } from '../utils/dragUtils';
import { calculateOperationLayers, getLaneHeight } from '../utils/laneUtils';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { RootState } from '../store';
import { setHighlightedWorkOrder, setSelectedOperation } from '../store/slices/timelineSlice';
import { useUpdateOperation } from '../hooks/useWorkOrders';
import { useTimelineData } from '../hooks/useWorkOrders';
import './MachineLane.css';

interface MachineLaneProps {
  machineId: string;
  operations: Array<Operation & { work_order_product: string }>;
  timelineStart: Date;
  timelineEnd: Date;
  width: number;
  onClearSelection: () => void;
  allOperations: Operation[];
  workOrders: any[];
}

export const MachineLane: React.FC<MachineLaneProps> = ({
  machineId,
  operations,
  timelineStart,
  timelineEnd,
  width,
  onClearSelection,
  allOperations,
  workOrders,
}) => {
  const dispatch = useAppDispatch();
  const { highlightedWorkOrderId, selectedOperation } = useAppSelector((state: RootState) => state.timeline);
  const baseUpdateMutation = useUpdateOperation();
  const { refetch: refetchTimelineData } = useTimelineData();
  
  // Override the mutation to include manual refetch and error handling
  const updateOperationMutation = {
    ...baseUpdateMutation,
    mutate: (variables: any) => {
      baseUpdateMutation.mutate(variables, {
        onSuccess: (data) => {
          console.log('Operation updated successfully, refetching timeline data...');
          refetchTimelineData();
        },
        onError: (error: any) => {
          console.error('Update failed:', error);
          
          // Extract error message from backend response
          let errorMessage = 'Failed to update operation';
          
          if (error?.response?.data?.detail) {
            const detail = error.response.data.detail;
            if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (detail.message && detail.details) {
              // Handle validation error format
              const messages = detail.details.map((d: any) => d.message).join('\n');
              errorMessage = `${detail.message}\n\n${messages}`;
            }
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          // Show error modal
          setErrorModal({
            isOpen: true,
            message: errorMessage
          });
          
          // Refetch to revert any visual changes
          refetchTimelineData();
        }
      });
    }
  };
  const [dragPreview, setDragPreview] = useState<{ isValid: boolean; conflicts: string[] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  
  // Calculate operation layers to prevent overlapping
  const operationLayers = useMemo(() => {
    return calculateOperationLayers(operations);
  }, [operations]);
  
  // Calculate dynamic lane height based on layers
  const laneHeight = useMemo(() => {
    return getLaneHeight(operations);
  }, [operations]);

  // Setup drop zone
  const [{ isOver, canDrop }, dropRef] = useDrop<DraggedOperation, void, { isOver: boolean; canDrop: boolean }>({
    accept: DRAG_TYPES.OPERATION,
    hover: (item: DraggedOperation, monitor: DropTargetMonitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const offset = monitor.getClientOffset();
      if (!offset) return;

      // Get container bounds
      const containerElement = containerRef.current;
      if (!containerElement) return;

      const rect = containerElement.getBoundingClientRect();
      const dropX = Math.max(0, offset.x - rect.left - 80); // Account for machine label width

      const { newStartTime, newEndTime } = calculateNewOperationTimes(
        item.operation,
        dropX,
        timelineStart,
        timelineEnd,
        width - 80
      );

      // Remove frontend validation - backend will handle R1-R3 rules
      // Always show as valid during drag preview
      setDragPreview({
        isValid: true,
        conflicts: [],
      });
    },
    drop: (item: DraggedOperation, monitor: DropTargetMonitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const offset = monitor.getClientOffset();
      if (!offset) return;

      const containerElement = containerRef.current;
      if (!containerElement) return;

      const rect = containerElement.getBoundingClientRect();
      const dropX = Math.max(0, offset.x - rect.left - 80);

      const { newStartTime, newEndTime } = calculateNewOperationTimes(
        item.operation,
        dropX,
        timelineStart,
        timelineEnd,
        width - 80
      );

      // Always send to backend - let server validate R1-R3 rules
      updateOperationMutation.mutate({
        operationId: item.operation.id,
        operationUpdate: {
          machine_id: machineId,
          start: newStartTime.toISOString(),
          end: newEndTime.toISOString(),
        }
      });

      setDragPreview(null);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleOperationClick = (operation: Operation) => {
    if (selectedOperation === operation.id) {
      // Clicking the same operation again deselects it
      dispatch(setSelectedOperation(null));
      dispatch(setHighlightedWorkOrder(null));
    } else {
      // Select this operation and highlight its work order
      dispatch(setSelectedOperation(operation.id));
      dispatch(setHighlightedWorkOrder(operation.work_order_id));
    }
  };

  const handleLaneClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on the lane itself, not on operations
    if (e.target === e.currentTarget) {
      onClearSelection();
    }
  };

  const getMachineClassNames = () => {
    let className = 'machine-lane';
    if (isOver && canDrop) {
      className += dragPreview?.isValid ? ' drop-valid' : ' drop-invalid';
    }
    return className;
  };

  const attachRefs = (element: HTMLDivElement | null) => {
    containerRef.current = element;
    (dropRef as any)(element);
  };

  return (
    <div 
      ref={attachRefs}
      className={getMachineClassNames()}
      style={{ width, height: laneHeight }}
      onClick={handleLaneClick}
    >
      {/* Machine label */}
      <div className="machine-label">
        <span>{machineId}</span>
        {isOver && dragPreview && !dragPreview.isValid && (
          <div className="drop-error">
            ❌ {dragPreview.conflicts[0]}
          </div>
        )}
        {isOver && dragPreview && dragPreview.isValid && (
          <div className="drop-success">
            ⏳ Pending server validation...
          </div>
        )}
      </div>
      
      {/* Operations container */}
      <div className="operations-container" style={{ width: width - 80 }}>
        {operations.map((operation) => {
          const left = getTimelinePosition(operation.start, timelineStart, timelineEnd, width - 80);
          const operationWidth = getOperationWidth(
            operation.start,
            operation.end,
            timelineStart,
            timelineEnd,
            width - 80
          );

          const isHighlighted = highlightedWorkOrderId === operation.work_order_id;
          const isSelected = selectedOperation === operation.id;
          
          // Get layer for this operation to prevent overlap
          const layer = operationLayers.get(operation.id) || 0;
          const topPosition = 15 + (layer * 50); // 15px base + 50px per layer

          return (
            <div key={operation.id} className="operation-wrapper" style={{ left, top: topPosition }}>
              <OperationBar
                operation={operation}
                left={0}
                width={operationWidth}
                isHighlighted={isHighlighted}
                isSelected={isSelected}
                workOrderProduct={operation.work_order_product}
                onClick={() => handleOperationClick(operation)}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                timelineWidth={width - 80}
              />
            </div>
          );
        })}
      </div>
      
      {/* Current time line */}
      <div className="current-time-line"></div>
      
      {/* Drop zone indicator */}
      {isOver && (
        <div className="drop-indicator">
          <div className="drop-zone-overlay"></div>
        </div>
      )}
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title="Cannot Move Operation"
        message={errorModal.message}
      />
    </div>
  );
};