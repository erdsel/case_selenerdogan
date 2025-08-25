from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.work_order import WorkOrder, Operation
from app.schemas.work_order import WorkOrderResponse, OperationUpdate
from app.repositories.work_order import work_order_repo, operation_repo
from app.business.scheduling_rules import scheduling_rules, SchedulingValidationError


class WorkOrderService:
    async def get_all_work_orders(self, db: AsyncSession) -> List[WorkOrderResponse]:
        """Get all work orders with their operations."""
        work_orders = await work_order_repo.get_all_with_operations(db)
        return [WorkOrderResponse.model_validate(wo) for wo in work_orders]
    
    async def get_work_order_by_id(self, db: AsyncSession, work_order_id: str) -> Optional[WorkOrderResponse]:
        """Get a specific work order with its operations."""
        work_order = await work_order_repo.get_with_operations(db, work_order_id)
        if work_order:
            return WorkOrderResponse.model_validate(work_order)
        return None
    
    async def update_operation(
        self,
        db: AsyncSession,
        operation_id: str,
        operation_update: OperationUpdate
    ) -> Dict[str, Any]:
        """
        Update an operation's start and end times with validation.
        Returns the updated operation or validation errors.
        """
        try:
            # Get the current operation
            operation = await operation_repo.get(db, operation_id)
            if not operation:
                return {
                    "success": False,
                    "error": "Operation not found",
                    "code": "NOT_FOUND"
                }
            
            # Prepare new values
            new_machine_id = operation_update.machine_id if operation_update.machine_id is not None else operation.machine_id
            new_start = operation_update.start if operation_update.start is not None else operation.start
            new_end = operation_update.end if operation_update.end is not None else operation.end
            
            # Validate the update (including machine change if applicable)
            validation_result = await scheduling_rules.validate_operation_update(
                db, operation_id, new_start, new_end, new_machine_id
            )
            
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "error": "Validation failed",
                    "code": "VALIDATION_ERROR",
                    "details": validation_result["errors"]
                }
            
            # Update the operation
            update_data = {}
            if operation_update.machine_id is not None:
                update_data["machine_id"] = operation_update.machine_id
            if operation_update.start is not None:
                update_data["start"] = operation_update.start
            if operation_update.end is not None:
                update_data["end"] = operation_update.end
            
            updated_operation = await operation_repo.update(
                db, db_obj=operation, obj_in=update_data
            )
            
            return {
                "success": True,
                "data": {
                    "id": updated_operation.id,
                    "work_order_id": updated_operation.work_order_id,
                    "index": updated_operation.index,
                    "machine_id": updated_operation.machine_id,
                    "name": updated_operation.name,
                    "start": updated_operation.start.isoformat(),
                    "end": updated_operation.end.isoformat()
                }
            }
            
        except SchedulingValidationError as e:
            return {
                "success": False,
                "error": e.message,
                "code": e.code
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "code": "INTERNAL_ERROR"
            }
    
    async def get_machine_schedule(
        self,
        db: AsyncSession,
        machine_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get all operations scheduled for a specific machine within a date range."""
        operations = await operation_repo.get_by_machine_id(
            db, machine_id, start_date, end_date
        )
        
        return [
            {
                "id": op.id,
                "work_order_id": op.work_order_id,
                "index": op.index,
                "name": op.name,
                "start": op.start.isoformat(),
                "end": op.end.isoformat()
            }
            for op in operations
        ]
    
    async def validate_work_order(
        self,
        db: AsyncSession,
        work_order_id: str
    ) -> Dict[str, Any]:
        """Validate all operations in a work order follow scheduling rules."""
        try:
            return await scheduling_rules.validate_work_order_consistency(db, work_order_id)
        except SchedulingValidationError as e:
            return {
                "valid": False,
                "error": e.message,
                "code": e.code
            }
    
    async def get_timeline_data(self, db: AsyncSession) -> Dict[str, Any]:
        """Get formatted data for the Gantt timeline visualization."""
        work_orders = await self.get_all_work_orders(db)
        
        # Group operations by machine (lane)
        machines = {}
        all_operations = []
        
        for wo in work_orders:
            for operation in wo.operations:
                machine_id = operation.machine_id
                if machine_id not in machines:
                    machines[machine_id] = []
                
                operation_data = {
                    "id": operation.id,
                    "work_order_id": operation.work_order_id,
                    "work_order_product": wo.product,
                    "index": operation.index,
                    "machine_id": machine_id,
                    "name": operation.name,
                    "start": operation.start,
                    "end": operation.end,
                    "display_name": f"{wo.id} · {operation.name}"
                }
                
                machines[machine_id].append(operation_data)
                all_operations.append(operation_data)
        
        # Sort operations within each machine by start time
        for machine_id in machines:
            machines[machine_id].sort(key=lambda x: x["start"])
        
        return {
            "work_orders": [wo.model_dump() for wo in work_orders],
            "machines": machines,
            "machine_ids": sorted(machines.keys()),
            "operations": all_operations
        }


# Singleton instance
work_order_service = WorkOrderService()