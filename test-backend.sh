#!/bin/bash

# Test script for Backend API - MongoDB Data Storage
# Make sure your server is running: pnpm dev (or pnpm run dev:backend)

echo "🧪 Testing Backend API - MongoDB Data Storage"
echo "=============================================="
echo ""

BASE_URL="http://localhost:3000/api/sessions"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📝 Step 1: Creating a new session..."
echo ""
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "role": "software_engineer",
      "customRole": "",
      "companyName": "Tech Corp",
      "interviewType": "behavioral",
      "difficulty": "mid",
      "interactionMode": "speech"
    },
    "resume": {
      "fileName": "test-resume.pdf",
      "content": "Test resume content for backend testing"
    }
  }')

echo "$SESSION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SESSION_RESPONSE"
echo ""

# Extract sessionId
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}❌ Failed to create session. Is the server running?${NC}"
  echo "   Run: pnpm dev (or pnpm run dev:backend)"
  exit 1
fi

echo -e "${GREEN}✅ Session created!${NC}"
echo -e "${YELLOW}Session ID: $SESSION_ID${NC}"
echo ""

echo "📝 Step 2: Adding conversation messages..."
echo ""

# Add assistant message (interviewer question)
echo "Adding interviewer question..."
curl -s -X POST "$BASE_URL/$SESSION_ID/conversations" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "assistant",
    "content": "Hello! Can you tell me about a challenging project you worked on?",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "metadata": {
      "isQuestion": true
    }
  }' | python3 -m json.tool 2>/dev/null || echo "Request sent"
echo ""

# Add user message (user response)
echo "Adding user response..."
curl -s -X POST "$BASE_URL/$SESSION_ID/conversations" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "I worked on a project where we had to migrate a legacy system to a modern architecture. It was challenging because we had to maintain zero downtime.",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' | python3 -m json.tool 2>/dev/null || echo "Request sent"
echo ""

# Add another assistant message
echo "Adding follow-up question..."
curl -s -X POST "$BASE_URL/$SESSION_ID/conversations" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "assistant",
    "content": "That sounds interesting. Can you walk me through the STAR method for that situation?",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "metadata": {
      "isQuestion": true
    }
  }' | python3 -m json.tool 2>/dev/null || echo "Request sent"
echo ""

echo -e "${GREEN}✅ Conversations added!${NC}"
echo ""

echo "📝 Step 3: Retrieving session with all conversations..."
echo ""
curl -s "$BASE_URL/$SESSION_ID" | python3 -m json.tool
echo ""

echo "📝 Step 4: Ending the session..."
echo ""
curl -s -X PUT "$BASE_URL/$SESSION_ID/end" \
  -H "Content-Type: application/json" \
  -d '{
    "statistics": {
      "questionCount": 2,
      "totalMessages": 4
    }
  }' | python3 -m json.tool
echo ""

echo "📝 Step 5: Creating a test report..."
echo ""
curl -s -X POST "$BASE_URL/$SESSION_ID/reports" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "feedback",
    "content": {
      "summary": "Test feedback report - candidate demonstrated good communication skills",
      "strengths": ["Clear articulation", "Good examples"],
      "weaknesses": ["Could use STAR framework better"],
      "recommendations": ["Practice STAR method", "Keep answers concise"],
      "scores": {
        "overall": 75,
        "communication": 80,
        "technical": 70,
        "behavior": 75
      },
      "statistics": {
        "totalDuration": 1200000,
        "questionCount": 2,
        "averageResponseTime": 60000
      }
    }
  }' | python3 -m json.tool
echo ""

echo "📝 Step 6: Retrieving the report..."
echo ""
curl -s "$BASE_URL/$SESSION_ID/report" | python3 -m json.tool
echo ""

echo "=============================================="
echo -e "${GREEN}✅ All API tests completed!${NC}"
echo ""
echo "📊 Next steps to verify in MongoDB Atlas:"
echo "   1. Go to: https://cloud.mongodb.com"
echo "   2. Navigate to: Database → Browse Collections"
echo "   3. Check the 'interview-agent' database"
echo "   4. You should see collections: sessions, conversations, reports"
echo "   5. Click on each collection to see the stored data"
echo ""
echo -e "${YELLOW}Session ID for reference: $SESSION_ID${NC}"
echo ""
