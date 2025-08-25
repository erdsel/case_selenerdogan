export interface Operation {
  id: string;
  work_order_id: string;
  index: number;
  machine_id: string;
  name: string;
  start: string;
  end: string;
}

export interface WorkOrder {
  id: string;
  product: string;
  qty: number;
  operations: Operation[];
}

export interface TimelineData {
  work_orders: WorkOrder[];
  machines: Record<string, Operation[]>;
  machine_ids: string[];
  operations: Operation[];
}

export interface OperationUpdate {
  machine_id?: string;
  start?: string;
  end?: string;
}

export interface ValidationError {
  rule: string;
  message: string;
  conflicts?: Array<{
    operation_id: string;
    work_order_id: string;
    start: string;
    end: string;
    name: string;
  }>;
}

export interface UpdateOperationResponse {
  success: boolean;
  data?: Operation;
  error?: string;
  code?: string;
  details?: ValidationError[];
}

export interface TimelineOperation extends Operation {
  work_order_product: string;
  display_name: string;
}