import { Operation } from '../types';
import { parseISO } from 'date-fns';

export interface OperationWithLayer extends Operation {
  layer: number;
}

/**
 * Calculate non-overlapping layers for operations in the same machine lane
 * Operations that overlap in time will be placed on different layers (rows)
 */
export function calculateOperationLayers(operations: Operation[]): Map<string, number> {
  const layerMap = new Map<string, number>();
  
  // Sort operations by start time
  const sortedOps = [...operations].sort((a, b) => 
    parseISO(a.start).getTime() - parseISO(b.start).getTime()
  );
  
  // Track end times for each layer
  const layerEndTimes: Date[] = [];
  
  sortedOps.forEach(op => {
    const opStart = parseISO(op.start);
    const opEnd = parseISO(op.end);
    
    // Find first available layer
    let assignedLayer = -1;
    for (let i = 0; i < layerEndTimes.length; i++) {
      if (layerEndTimes[i] <= opStart) {
        assignedLayer = i;
        layerEndTimes[i] = opEnd;
        break;
      }
    }
    
    // If no layer available, create new one
    if (assignedLayer === -1) {
      assignedLayer = layerEndTimes.length;
      layerEndTimes.push(opEnd);
    }
    
    layerMap.set(op.id, assignedLayer);
  });
  
  return layerMap;
}

/**
 * Get the required height for a machine lane based on number of layers
 */
export function getLaneHeight(operations: Operation[]): number {
  const layerMap = calculateOperationLayers(operations);
  const maxLayer = Math.max(...Array.from(layerMap.values()), 0);
  const baseHeight = 80; // Base height for single layer
  const layerHeight = 50; // Additional height per layer
  return baseHeight + (maxLayer * layerHeight);
}