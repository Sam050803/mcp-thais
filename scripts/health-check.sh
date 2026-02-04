#!/bin/bash

# Quick Health Check Script
# Usage: ./health-check.sh [url]

URL=${1:-http://localhost:3000}

echo "🏥 Health Check - MCP Thaïs Server"
echo "Target: $URL"
echo "=========================="

# Basic connectivity
echo -n "🔍 Connectivity: "
if curl -s -f "$URL/health" >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAIL"
    exit 1
fi

# Response time
echo -n "⏱️  Response time: "
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' "$URL/health")
echo "${RESPONSE_TIME}s"

# Health endpoint details
echo "📊 Health details:"
curl -s "$URL/health" | jq '.' 2>/dev/null || curl -s "$URL/health"

echo ""
echo "✅ Health check completed"