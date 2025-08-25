from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.work_order import WorkOrderResponse, OperationUpdate
from app.services.work_order_service import work_order_service

router = APIRouter()


@router.get("/", response_model=List[WorkOrderResponse])
async def get_work_orders(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all work orders with their operations.
    """
    return await work_order_service.get_all_work_orders(db)


@router.get("/{work_order_id}", response_model=WorkOrderResponse)
async def get_work_order(
    work_order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific work order with its operations.
    """
    work_order = await work_order_service.get_work_order_by_id(db, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    return work_order


@router.get("/{work_order_id}/validate")
async def validate_work_order(
    work_order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate that all operations in a work order follow scheduling rules.
    """
    result = await work_order_service.validate_work_order(db, work_order_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.put("/operations/{operation_id}")
async def update_operation(
    operation_id: str,
    operation_update: OperationUpdate,
    db: AsyncSession = Depends(get_db)
):
    
    result = await work_order_service.update_operation(db, operation_id, operation_update)
    
    if not result["success"]:
        if result["code"] == "NOT_FOUND":
            raise HTTPException(status_code=404, detail=result["error"])
        elif result["code"] == "VALIDATION_ERROR":
            raise HTTPException(
                status_code=400, 
                detail={
                    "message": result["error"],
                    "details": result.get("details", [])
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    
    return result["data"]


@router.get("/timeline/data")
async def get_timeline_data(
    db: AsyncSession = Depends(get_db)
):
    
    return await work_order_service.get_timeline_data(db)


@router.get("/machines/{machine_id}/schedule")
async def get_machine_schedule(
    machine_id: str,
    start_date: Optional[str] = Query(None, description="Start date in ISO format"),
    end_date: Optional[str] = Query(None, description="End date in ISO format"),
    db: AsyncSession = Depends(get_db)
):
   
    start_datetime = None
    end_datetime = None
    
    if start_date:
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
    
    if end_date:
        try:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
    
    return await work_order_service.get_machine_schedule(
        db, machine_id, start_datetime, end_datetime
    )