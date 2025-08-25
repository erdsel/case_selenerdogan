import { Operation } from '../types';
import { DropResult } from '../types/dragDrop';

export interface DragValidationResult {
  isValid: boolean;
  conflicts: string[];
  newStartTime: Date;
  newEndTime: Date;
}

/**
 * Calculate new operation times based on drop position
 */
export function calculateNewOperationTimes(
  operation: Operation,
  dropX: number,
  timelineStart: Date,
  timelineEnd: Date,
  timelineWidth: number
): { newStartTime: Date; newEndTime: Date } {
  const timelineRange = timelineEnd.getTime() - timelineStart.getTime();
  const pixelsPerMs = timelineWidth / timelineRange;
  
  // Calculate the operation duration
  const originalDuration = new Date(operation.end).getTime() - new Date(operation.start).getTime();
  
  // Calculate new start time based on drop position
  const newStartTime = new Date(timelineStart.getTime() + (dropX / pixelsPerMs));
  const newEndTime = new Date(newStartTime.getTime() + originalDuration);
  
  return { newStartTime, newEndTime };
}

/**
 * Validate if the new operation position conflicts with scheduling rules
 */
export function validateOperationDrop(
  operation: Operation,
  newStartTime: Date,
  newEndTime: Date,
  newMachineId: string,
  allOperations: Operation[],
  workOrders: any[]
): DragValidationResult {
  const conflicts: string[] = [];
  
  // Rule 1: No past scheduling (assuming "now" is current time)
  const now = new Date();
  if (newStartTime < now) {
    conflicts.push(`Cannot schedule operation in the past`);
  }
  
  // Rule 2: Check machine conflicts (no overlapping operations on same machine)
  const machineOperations = allOperations.filter(
    op => op.machine_id === newMachineId && op.id !== operation.id
  );
  
  for (const otherOp of machineOperations) {
    const otherStart = new Date(otherOp.start);
    const otherEnd = new Date(otherOp.end);
    
    // Check for overlap
    if (
      (newStartTime < otherEnd && newEndTime > otherStart)
    ) {
      conflicts.push(`Overlaps with operation ${otherOp.work_order_id} · ${otherOp.name}`);
    }
  }
  
  // Rule 3: Check precedence within work order
  const workOrder = workOrders.find(wo => wo.id === operation.work_order_id);
  if (workOrder) {
    const workOrderOps = workOrder.operations.sort((a: Operation, b: Operation) => a.index - b.index);
    const currentOpIndex = workOrderOps.findIndex((op: Operation) => op.id === operation.id);
    
    // Check previous operation
    if (currentOpIndex > 0) {
      const prevOp = workOrderOps[currentOpIndex - 1];
      const prevEnd = new Date(prevOp.end);
      if (newStartTime < prevEnd) {
        conflicts.push(`Must start after previous operation ${prevOp.work_order_id} · ${prevOp.name} ends`);
      }
    }
    
    // Check next operation
    if (currentOpIndex < workOrderOps.length - 1) {
      const nextOp = workOrderOps[currentOpIndex + 1];
      const nextStart = new Date(nextOp.start);
      if (newEndTime > nextStart) {
        conflicts.push(`Must end before next operation ${nextOp.work_order_id} · ${nextOp.name} starts`);
      }
    }
  }
  
  return {
    isValid: conflicts.length === 0,
    conflicts,
    newStartTime,
    newEndTime
  };
}

/**
 * Snap operation to grid for better alignment
 */
export function snapToGrid(
  value: number,
  gridSize: number = 15 // 15 minute intervals
): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Convert pixel position to time with optional grid snapping
 */
export function pixelToTime(
  pixelX: number,
  timelineStart: Date,
  timelineEnd: Date,
  timelineWidth: number,
  snapToGridMinutes?: number
): Date {
  const timelineRange = timelineEnd.getTime() - timelineStart.getTime();
  const pixelsPerMs = timelineWidth / timelineRange;
  
  let timeMs = timelineStart.getTime() + (pixelX / pixelsPerMs);
  
  if (snapToGridMinutes) {
    const gridMs = snapToGridMinutes * 60 * 1000;
    timeMs = Math.round(timeMs / gridMs) * gridMs;
  }
  
  return new Date(timeMs);
}