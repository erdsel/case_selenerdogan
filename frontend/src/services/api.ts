import axios from 'axios';
import { WorkOrder, OperationUpdate, UpdateOperationResponse, TimelineData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data);
      
      // Handle specific error types
      if (status === 400) {
        throw new Error(data.detail?.message || data.detail || 'Bad request');
      } else if (status === 404) {
        throw new Error(data.detail || 'Resource not found');
      } else if (status === 500) {
        throw new Error('Internal server error');
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error - unable to reach server');
    }
    
    throw error;
  }
);

export const workOrderApi = {
  // Get all work orders
  getWorkOrders: async (): Promise<WorkOrder[]> => {
    const response = await api.get<WorkOrder[]>('/work-orders/');
    return response.data;
  },

  // Get specific work order
  getWorkOrder: async (workOrderId: string): Promise<WorkOrder> => {
    const response = await api.get<WorkOrder>(`/work-orders/${workOrderId}`);
    return response.data;
  },

  // Update operation
  updateOperation: async (
    operationId: string, 
    operationUpdate: OperationUpdate
  ): Promise<UpdateOperationResponse> => {
    try {
      const response = await api.put(`/work-orders/operations/${operationId}`, operationUpdate);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        code: error.response?.data?.code,
        details: error.response?.data?.details,
      };
    }
  },

  // Get timeline data
  getTimelineData: async (): Promise<TimelineData> => {
    const response = await api.get<TimelineData>('/work-orders/timeline/data');
    return response.data;
  },

  // Get machine schedule
  getMachineSchedule: async (
    machineId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(
      `/work-orders/machines/${machineId}/schedule?${params.toString()}`
    );
    return response.data;
  },

  // Validate work order
  validateWorkOrder: async (workOrderId: string): Promise<any> => {
    const response = await api.get(`/work-orders/${workOrderId}/validate`);
    return response.data;
  },
};

export default api;