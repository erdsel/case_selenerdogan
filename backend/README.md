# Factory Scheduler - Backend API

FastAPI backend for the Factory Scheduler application with PostgreSQL database, SQLAlchemy ORM, and comprehensive business rule validation.

##  Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Run database setup and start server
python scripts/seed_data.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

##  Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/      # API route handlers
│   ├── business/              # Business logic and validation rules
│   ├── core/                  # Configuration and settings
│   ├── db/                    # Database connection and session management
│   ├── models/                # SQLAlchemy database models
│   ├── repositories/          # Data access layer
│   ├── schemas/               # Pydantic request/response models
│   ├── services/              # Business service layer
│   └── main.py               # FastAPI application entry point
├── alembic/                   # Database migration files
├── scripts/                   # Utility scripts for setup and maintenance
└── requirements.txt          # Python dependencies
```

##  Architecture

### Layered Architecture

1. **API Layer** (`app/api/`): FastAPI route handlers
2. **Service Layer** (`app/services/`): Business logic coordination
3. **Business Layer** (`app/business/`): Core business rules and validation
4. **Repository Layer** (`app/repositories/`): Data access patterns
5. **Model Layer** (`app/models/`): Database models

### Key Components

- **Scheduling Rules Engine**: Validates all business constraints
- **Repository Pattern**: Abstracted database operations
- **Service Layer**: Orchestrates business operations
- **Async/Await**: Full async support with SQLAlchemy 2.0

##  Database Schema

### WorkOrder
```sql
CREATE TABLE work_orders (
    id VARCHAR PRIMARY KEY,
    product VARCHAR NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0)
);
```

### Operation
```sql
CREATE TABLE operations (
    id VARCHAR PRIMARY KEY,
    work_order_id VARCHAR NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    index INTEGER NOT NULL CHECK (index > 0),
    machine_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    end TIMESTAMPTZ NOT NULL CHECK (end > start),
    UNIQUE(work_order_id, index)
);
```

##  Business Rules

### R1 - Precedence
Operations within a work order must follow sequential order:
- Operation N+1 must start ≥ Operation N end time

### R2 - Lane Exclusivity  
No overlapping operations on the same machine:
- Check for time conflicts on machineId

### R3 - No Past Scheduling
Operations cannot be scheduled in the past:
- Operation start time must be ≥ current time

##  API Endpoints

All endpoints are available at `/api/v1/` with full OpenAPI documentation at `/docs`.


## 📝 Development

### Adding New Features

1. **Models**: Add SQLAlchemy models in `app/models/`
2. **Schemas**: Define Pydantic schemas in `app/schemas/`
3. **Repository**: Create data access methods in `app/repositories/`
4. **Business Logic**: Implement rules in `app/business/`
5. **Service**: Coordinate operations in `app/services/`
6. **API**: Add endpoints in `app/api/v1/endpoints/`

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Downgrade
alembic downgrade -1
```

##  Deployment

### Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
SECRET_KEY=your-secret-key
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

### Production Setup

```bash
# Install production dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```
