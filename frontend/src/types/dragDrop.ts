import { Operation } from './index';

export interface DraggedOperation {
  operation: Operation;
  originalLeft: number;
  originalWidth: number;
}

export interface DropResult {
  machineId: string;
  newStartTime: Date;
  newEndTime: Date;
}

export interface DragPreview {
  operation: Operation;
  newLeft: number;
  newWidth: number;
  isValid: boolean;
  conflicts: string[];
}

export const DRAG_TYPES = {
  OPERATION: 'operation',
} as const;

export type DragType = typeof DRAG_TYPES[keyof typeof DRAG_TYPES];