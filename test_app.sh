#!/bin/bash

echo " Testing Factory Scheduler v2 (Advanced Version)"
echo "=================================================="

echo -n " Checking Backend Health: "
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo " Backend is healthy"
else
    echo " Backend health check failed"
    exit 1
fi

echo -n " Testing Work Orders API: "
if curl -s http://localhost:8000/api/v1/work-orders/ | grep -q "WO-1001"; then
    echo " Work Orders API working"
else
    echo " Work Orders API failed"
    exit 1
fi

echo -n " Testing Timeline Data API: "
if curl -s http://localhost:8000/api/v1/work-orders/timeline/data | grep -q "machines"; then
    echo " Timeline Data API working"
else
    echo " Timeline Data API failed"
fi

echo -n " Testing Frontend: "
if curl -s http://localhost:3000 | grep -q "react-app"; then
    echo " Frontend is serving"
else
    echo " Frontend not responding"
    exit 1
fi

