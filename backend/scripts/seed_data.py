import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.db.base import AsyncSessionLocal, engine, Base
from app.models.work_order import WorkOrder, Operation


async def create_tables():
    """Create database tables."""
    async with engine.begin() as conn:
        # Drop all tables first (for development)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print(" Tables created successfully")


async def seed_data():
    """Seed the database with initial work order data."""
    
    # Seed data from the case study
    seed_work_orders = [
        {
            "id": "WO-1001",
            "product": "Widget A",
            "qty": 100,
            "operations": [
                {
                    "id": "OP-1",
                    "work_order_id": "WO-1001",
                    "index": 1,
                    "machine_id": "M1",
                    "name": "Cut",
                    "start": datetime.fromisoformat("2025-08-20T09:00:00+00:00"),
                    "end": datetime.fromisoformat("2025-08-20T10:00:00+00:00")
                },
                {
                    "id": "OP-2",
                    "work_order_id": "WO-1001",
                    "index": 2,
                    "machine_id": "M2",
                    "name": "Assemble",
                    "start": datetime.fromisoformat("2025-08-20T10:10:00+00:00"),
                    "end": datetime.fromisoformat("2025-08-20T12:00:00+00:00")
                }
            ]
        },
        {
            "id": "WO-1002",
            "product": "Widget B",
            "qty": 50,
            "operations": [
                {
                    "id": "OP-3",
                    "work_order_id": "WO-1002",
                    "index": 1,
                    "machine_id": "M1",
                    "name": "Cut",
                    "start": datetime.fromisoformat("2025-08-20T09:30:00+00:00"),
                    "end": datetime.fromisoformat("2025-08-20T10:30:00+00:00")
                },
                {
                    "id": "OP-4",
                    "work_order_id": "WO-1002",
                    "index": 2,
                    "machine_id": "M2",
                    "name": "Assemble",
                    "start": datetime.fromisoformat("2025-08-20T10:40:00+00:00"),
                    "end": datetime.fromisoformat("2025-08-20T12:15:00+00:00")
                }
            ]
        }
    ]
    
    async with AsyncSessionLocal() as session:
        # Create work orders and operations
        for wo_data in seed_work_orders:
            operations_data = wo_data.pop("operations")
            
            # Create work order
            work_order = WorkOrder(**wo_data)
            session.add(work_order)
            
            # Create operations
            for op_data in operations_data:
                operation = Operation(**op_data)
                session.add(operation)
        
        await session.commit()
        print(" Seed data inserted successfully")


async def main():
    """Main function to set up database and seed data."""
    print("🔧 Setting up database...")
    
    try:
        await create_tables()
        await seed_data()
        print("🎉 Database setup completed successfully!")
        
    except Exception as e:
        print(f" Error setting up database: {e}")
        raise
    
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())