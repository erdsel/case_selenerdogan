import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrderApi } from '../services/api';
import { WorkOrder, OperationUpdate, TimelineData } from '../types';

// Query keys
export const workOrderKeys = {
  all: ['work-orders'] as const,
  lists: () => [...workOrderKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...workOrderKeys.lists(), { filters }] as const,
  details: () => [...workOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
  timeline: () => [...workOrderKeys.all, 'timeline'] as const,
};

// Hook to get all work orders
export const useWorkOrders = () => {
  return useQuery({
    queryKey: workOrderKeys.lists(),
    queryFn: workOrderApi.getWorkOrders,
    select: (data: WorkOrder[]) => {
      // Sort work orders by ID for consistent display
      return data.sort((a, b) => a.id.localeCompare(b.id));
    },
  });
};

// Hook to get specific work order
export const useWorkOrder = (workOrderId: string) => {
  return useQuery({
    queryKey: workOrderKeys.detail(workOrderId),
    queryFn: () => workOrderApi.getWorkOrder(workOrderId),
    enabled: !!workOrderId,
  });
};

// Hook to get timeline data
export const useTimelineData = () => {
  return useQuery({
    queryKey: workOrderKeys.timeline(),
    queryFn: workOrderApi.getTimelineData,
    select: (data: TimelineData) => {
      // Sort operations within each machine by start time
      const sortedMachines = { ...data.machines };
      Object.keys(sortedMachines).forEach(machineId => {
        sortedMachines[machineId] = sortedMachines[machineId].sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
      });

      return {
        ...data,
        machines: sortedMachines,
        machine_ids: data.machine_ids.sort(),
      };
    },
  });
};

// Hook to update operation
export const useUpdateOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ operationId, operationUpdate }: { 
      operationId: string; 
      operationUpdate: OperationUpdate;
    }) => workOrderApi.updateOperation(operationId, operationUpdate),
    
    onSuccess: (data, variables) => {
      if (data.success && data.data) {
        // Invalidate and refetch work orders and timeline data
        queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
        queryClient.invalidateQueries({ queryKey: workOrderKeys.timeline() });
        
        // Invalidate the specific work order if we know which one was updated
        const workOrderId = data.data.work_order_id;
        if (workOrderId) {
          queryClient.invalidateQueries({ 
            queryKey: workOrderKeys.detail(workOrderId) 
          });
        }
        
        console.log('Operation updated successfully:', data.data);
      } else {
        console.error('Operation update failed:', data.error, data.details);
        throw new Error(data.error || 'Update failed');
      }
    },
    
    onError: (error: any) => {
      console.error('Mutation error:', error);
    },
  });
};

// Hook to validate work order
export const useValidateWorkOrder = (workOrderId: string) => {
  return useQuery({
    queryKey: [...workOrderKeys.detail(workOrderId), 'validate'],
    queryFn: () => workOrderApi.validateWorkOrder(workOrderId),
    enabled: !!workOrderId,
  });
};