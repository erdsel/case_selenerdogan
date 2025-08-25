from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.models.work_order import WorkOrder, Operation
from app.schemas.work_order import WorkOrderCreate, OperationUpdate
from app.repositories.base import BaseRepository


class WorkOrderRepository(BaseRepository[WorkOrder, WorkOrderCreate, None]):
    def __init__(self):
        super().__init__(WorkOrder)
    
    async def get_with_operations(self, db: AsyncSession, work_order_id: str) -> Optional[WorkOrder]:
        query = select(WorkOrder).options(
            selectinload(WorkOrder.operations)
        ).where(WorkOrder.id == work_order_id)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_with_operations(self, db: AsyncSession) -> List[WorkOrder]:
        query = select(WorkOrder).options(
            selectinload(WorkOrder.operations)
        ).order_by(WorkOrder.id)
        
        result = await db.execute(query)
        return result.scalars().all()


class OperationRepository(BaseRepository[Operation, None, OperationUpdate]):
    def __init__(self):
        super().__init__(Operation)
    
    async def get_by_work_order_id(self, db: AsyncSession, work_order_id: str) -> List[Operation]:
        query = select(Operation).where(
            Operation.work_order_id == work_order_id
        ).order_by(Operation.index)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_machine_id(
        self, 
        db: AsyncSession, 
        machine_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Operation]:
        query = select(Operation).where(Operation.machine_id == machine_id)
        
        if start_time and end_time:
            # Check for overlaps: operation ends after start_time AND operation starts before end_time
            query = query.where(
                and_(
                    Operation.end > start_time,
                    Operation.start < end_time
                )
            )
        
        query = query.order_by(Operation.start)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def check_machine_conflicts(
        self,
        db: AsyncSession,
        machine_id: str,
        start_time: datetime,
        end_time: datetime,
        exclude_operation_id: Optional[str] = None
    ) -> List[Operation]:
        query = select(Operation).where(
            and_(
                Operation.machine_id == machine_id,
                Operation.end > start_time,
                Operation.start < end_time
            )
        )
        
        if exclude_operation_id:
            query = query.where(Operation.id != exclude_operation_id)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_operations_by_work_order_after_index(
        self,
        db: AsyncSession,
        work_order_id: str,
        index: int
    ) -> List[Operation]:
        query = select(Operation).where(
            and_(
                Operation.work_order_id == work_order_id,
                Operation.index > index
            )
        ).order_by(Operation.index)
        
        result = await db.execute(query)
        return result.scalars().all()


# Singleton instances
work_order_repo = WorkOrderRepository()
operation_repo = OperationRepository()