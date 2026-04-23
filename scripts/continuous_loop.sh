#!/bin/bash

# Fraude-Ary Continuous Improvement Loop
# This script runs indefinitely, improving the application

set -e

REPO_DIR="/root/fraude-ary"
LOG_FILE="/root/fraude-ary/logs/loop.log"
ITERATION=0

mkdir -p /root/fraude-ary/logs

echo "Starting Fraude-Ary Continuous Improvement Loop..."
echo "Logs will be written to $LOG_FILE"

while true; do
    ITERATION=$((ITERATION + 1))
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Iteration $ITERATION - $(date)" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    
    # Step 1: Test current state
    echo "[Step 1] Testing current application state..." | tee -a "$LOG_FILE"
    
    # Check if containers are running
    if ! docker ps | grep -q infra-backend-1; then
        echo "Containers not running, restarting..." | tee -a "$LOG_FILE"
        cd "$REPO_DIR/infra" && docker compose up -d
        sleep 15
    fi
    
    # Test backend health
    if curl -s http://localhost:8000/health | grep -q "ok"; then
        echo "Backend is healthy" | tee -a "$LOG_FILE"
    else
        echo "Backend is NOT healthy!" | tee -a "$LOG_FILE"
    fi
    
    # Test login
    TOKEN=$(curl -s -X POST http://localhost/auth/login \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=demo@fraude-ary.com&password=demo123456" | \
        python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
    
    if [ -n "$TOKEN" ]; then
        echo "Login works - Token obtained" | tee -a "$LOG_FILE"
        
        # Test asset creation
        CREATE_RESULT=$(curl -s -X POST http://localhost/api/v1/assets \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"type":"stocks","symbol":"LOOP","quantity":1,"purchase_price":100}' | \
            python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','FAIL'))" 2>/dev/null)
        
        if [ "$CREATE_RESULT" != "FAIL" ] && [ -n "$CREATE_RESULT" ]; then
            echo "Asset creation works - ID: $CREATE_RESULT" | tee -a "$LOG_FILE"
        else
            echo "Asset creation FAILED!" | tee -a "$LOG_FILE"
        fi
        
        # Test portfolio summary
        PORTFOLIO=$(curl -s http://localhost/api/v1/portfolio/summary \
            -H "Authorization: Bearer $TOKEN" | \
            python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_value','FAIL'))" 2>/dev/null)
        
        if [ "$PORTFOLIO" != "FAIL" ] && [ -n "$PORTFOLIO" ]; then
            echo "Portfolio works - Total: $PORTFOLIO" | tee -a "$LOG_FILE"
        else
            echo "Portfolio FAILED!" | tee -a "$LOG_FILE"
        fi
    else
        echo "Login FAILED!" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    echo "Iteration $ITERATION complete. Sleeping for 5 minutes..." | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    sleep 300
done