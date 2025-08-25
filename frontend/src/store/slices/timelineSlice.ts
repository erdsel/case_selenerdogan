import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkOrder } from '../../types';

interface TimelineState {
  highlightedWorkOrderId: string | null;
  selectedOperation: string | null;
  workOrders: WorkOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: TimelineState = {
  highlightedWorkOrderId: null,
  selectedOperation: null,
  workOrders: [],
  loading: false,
  error: null,
};

const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setHighlightedWorkOrder: (state, action: PayloadAction<string | null>) => {
      state.highlightedWorkOrderId = action.payload;
    },
    setSelectedOperation: (state, action: PayloadAction<string | null>) => {
      state.selectedOperation = action.payload;
    },
    setWorkOrders: (state, action: PayloadAction<WorkOrder[]>) => {
      state.workOrders = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearHighlight: (state) => {
      state.highlightedWorkOrderId = null;
      state.selectedOperation = null;
    },
    updateOperationInStore: (state, action: PayloadAction<{ operationId: string; start: string; end: string }>) => {
      const { operationId, start, end } = action.payload;
      
      // Find and update the operation in the work orders
      state.workOrders.forEach(workOrder => {
        const operation = workOrder.operations.find(op => op.id === operationId);
        if (operation) {
          operation.start = start;
          operation.end = end;
        }
      });
    },
  },
});

export const {
  setHighlightedWorkOrder,
  setSelectedOperation,
  setWorkOrders,
  setLoading,
  setError,
  clearHighlight,
  updateOperationInStore,
} = timelineSlice.actions;

export default timelineSlice.reducer;