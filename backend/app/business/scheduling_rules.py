from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.work_order import Operation
from app.repositories.work_order import operation_repo, work_order_repo


class SchedulingValidationError(Exception):
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class SchedulingRules:
    @staticmethod
    async def validate_operation_update(
        db: AsyncSession,
        operation_id: str,
        new_start: Optional[datetime] = None,
        new_end: Optional[datetime] = None,
        new_machine_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates operation update against all scheduling rules.
        Returns validation result with success status and any errors.
        """
        operation = await operation_repo.get(db, operation_id)
        if not operation:
            raise SchedulingValidationError("Operation not found", "NOT_FOUND")
        
        # Use new values if provided, otherwise keep current values
        start_time = new_start if new_start is not None else operation.start
        end_time = new_end if new_end is not None else operation.end
        
        # Basic validation: end must be after start
        if end_time <= start_time:
            raise SchedulingValidationError(
                "Operation end time must be after start time",
                "INVALID_TIME_RANGE"
            )
        
        errors = []
        
        # R3: No past scheduling
        from datetime import timezone
        now = datetime.now(timezone.utc)
        if start_time < now:
            errors.append({
                "rule": "R3",
                "message": f"Operation start time cannot be in the past. Current time: {now.isoformat()}"
            })
        
        # R1: Precedence validation (within WO)
        precedence_errors = await SchedulingRules._validate_precedence_rule(
            db, operation, start_time, end_time
        )
        errors.extend(precedence_errors)
        
        # R2: Lane exclusivity (machine conflicts)
        # Use new machine ID if provided, otherwise current machine
        check_machine_id = new_machine_id if new_machine_id is not None else operation.machine_id
        machine_conflict_errors = await SchedulingRules._validate_machine_conflicts(
            db, operation, start_time, end_time, check_machine_id
        )
        errors.extend(machine_conflict_errors)
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "operation_id": operation_id,
            "proposed_start": start_time.isoformat(),
            "proposed_end": end_time.isoformat()
        }
    
    @staticmethod
    async def _validate_precedence_rule(
        db: AsyncSession,
        operation: Operation,
        new_start: datetime,
        new_end: datetime
    ) -> List[Dict[str, Any]]:
        """R1: Precedence (within WO) - operation k must start at or after operation k-1 ends."""
        errors = []
        
        # Get all operations for this work order
        work_order_operations = await operation_repo.get_by_work_order_id(
            db, operation.work_order_id
        )
        
        # Check previous operation (index - 1)
        if operation.index > 1:
            previous_op = next(
                (op for op in work_order_operations if op.index == operation.index - 1), 
                None
            )
            if previous_op and new_start < previous_op.end:
                errors.append({
                    "rule": "R1",
                    "message": f"Operation {operation.index} cannot start before operation {previous_op.index} ends. "
                             f"Previous operation ends at: {previous_op.end.isoformat()}"
                })
        
        # Check next operation (index + 1)
        next_op = next(
            (op for op in work_order_operations if op.index == operation.index + 1), 
            None
        )
        if next_op and new_end > next_op.start:
            errors.append({
                "rule": "R1",
                "message": f"Operation {operation.index} cannot end after operation {next_op.index} starts. "
                         f"Next operation starts at: {next_op.start.isoformat()}"
            })
        
        return errors
    
    @staticmethod
    async def _validate_machine_conflicts(
        db: AsyncSession,
        operation: Operation,
        new_start: datetime,
        new_end: datetime,
        machine_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """R2: Lane exclusivity - no overlaps with other operations on the same machineId."""
        errors = []
        
        # Check for conflicts with other operations on the same machine
        # Use provided machine_id if available, otherwise use operation's current machine_id
        target_machine = machine_id if machine_id is not None else operation.machine_id
        conflicting_operations = await operation_repo.check_machine_conflicts(
            db, 
            target_machine, 
            new_start, 
            new_end,
            exclude_operation_id=operation.id
        )
        
        if conflicting_operations:
            conflict_details = []
            for conflict_op in conflicting_operations:
                conflict_details.append({
                    "operation_id": conflict_op.id,
                    "work_order_id": conflict_op.work_order_id,
                    "start": conflict_op.start.isoformat(),
                    "end": conflict_op.end.isoformat(),
                    "name": conflict_op.name
                })
            
            errors.append({
                "rule": "R2",
                "message": f"Operation conflicts with {len(conflicting_operations)} existing operation(s) on machine {operation.machine_id}",
                "conflicts": conflict_details
            })
        
        return errors
    
    @staticmethod
    async def validate_work_order_consistency(
        db: AsyncSession,
        work_order_id: str
    ) -> Dict[str, Any]:
        """
        Validates that all operations in a work order follow the precedence rule.
        """
        work_order = await work_order_repo.get_with_operations(db, work_order_id)
        if not work_order:
            raise SchedulingValidationError("Work order not found", "NOT_FOUND")
        
        errors = []
        operations = sorted(work_order.operations, key=lambda x: x.index)
        
        # Check precedence between consecutive operations
        for i in range(len(operations) - 1):
            current_op = operations[i]
            next_op = operations[i + 1]
            
            if next_op.start < current_op.end:
                errors.append({
                    "rule": "R1",
                    "message": f"Operation {next_op.index} starts before operation {current_op.index} ends",
                    "current_operation": {
                        "id": current_op.id,
                        "index": current_op.index,
                        "end": current_op.end.isoformat()
                    },
                    "next_operation": {
                        "id": next_op.id,
                        "index": next_op.index,
                        "start": next_op.start.isoformat()
                    }
                })
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "work_order_id": work_order_id
        }


# Singleton instance
scheduling_rules = SchedulingRules()