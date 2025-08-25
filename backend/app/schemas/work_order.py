from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator
from pydantic.config import ConfigDict


class OperationBase(BaseModel):
    id: str
    work_order_id: str
    index: int
    machine_id: str
    name: str
    start: datetime
    end: datetime
    
    @field_validator('end')
    def validate_end_after_start(cls, v, info):
        if 'start' in info.data and v <= info.data['start']:
            raise ValueError('End time must be after start time')
        return v
    
    @field_validator('index')
    def validate_index_positive(cls, v):
        if v <= 0:
            raise ValueError('Index must be positive')
        return v


class OperationCreate(OperationBase):
    pass


class OperationUpdate(BaseModel):
    machine_id: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    
    @field_validator('end')
    def validate_end_after_start(cls, v, info):
        if 'start' in info.data and v and info.data['start'] and v <= info.data['start']:
            raise ValueError('End time must be after start time')
        return v


class OperationResponse(OperationBase):
    model_config = ConfigDict(from_attributes=True)


class WorkOrderBase(BaseModel):
    id: str
    product: str
    qty: int
    
    @field_validator('qty')
    def validate_qty_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v


class WorkOrderCreate(WorkOrderBase):
    operations: List[OperationCreate]


class WorkOrderResponse(WorkOrderBase):
    operations: List[OperationResponse] = []
    
    model_config = ConfigDict(from_attributes=True)