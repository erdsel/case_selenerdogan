from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Index, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = Column(String, primary_key=True, index=True)
    product = Column(String, nullable=False)
    qty = Column(Integer, nullable=False)
    
    # Relationships
    operations = relationship("Operation", back_populates="work_order", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('qty > 0', name='check_qty_positive'),
    )


class Operation(Base):
    __tablename__ = "operations"
    
    id = Column(String, primary_key=True, index=True)
    work_order_id = Column(String, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False)
    index = Column(Integer, nullable=False)
    machine_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    start = Column(DateTime(timezone=True), nullable=False)
    end = Column('end_time', DateTime(timezone=True), nullable=False)
    
    # Relationships
    work_order = relationship("WorkOrder", back_populates="operations")
    
    __table_args__ = (
        Index('ix_operation_work_order_index', 'work_order_id', 'index', unique=True),
        Index('ix_operation_machine_time', 'machine_id', 'start', 'end_time'),
        CheckConstraint('end_time > start', name='check_end_after_start'),
        CheckConstraint('index > 0', name='check_index_positive'),
    )