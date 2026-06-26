#!/bin/bash
BASE="https://hockey-deviant-brooks-litigation.trycloudflare.com/api"

# Get admin token
ADMIN_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"Admin123!"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token','') or (d.get('temp_token','') and ''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
  TEMP=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('temp_token',''))")
  OTP=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('otpCode',''))")
  SID=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sessionId',''))")
  ADMIN_TOKEN=$(curl -s -X POST "$BASE/auth/verify-otp" -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SID\",\"tempToken\":\"$TEMP\",\"code\":\"$OTP\",\"otpType\":\"email\"}" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))")
fi

echo "Admin Token: ${ADMIN_TOKEN:0:20}..."

# Get staff token
STAFF_RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"staff1","password":"Admin123!"}')
STAFF_TOKEN=$(echo "$STAFF_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))")
echo "Staff Token: ${STAFF_TOKEN:0:20}..."

H="Authorization: Bearer $ADMIN_TOKEN"
HC="Content-Type: application/json"

echo ""
echo "=== 1. GET /users (List) ==="
curl -s "$BASE/users?page=1&limit=5" -H "$H" | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "=== 2. POST /users (Create User) ==="
CREATE_RESP=$(curl -s -X POST "$BASE/users" -H "$H" -H "$HC" \
  -d '{
    "username": "testuser_qa_001",
    "password": "Test123456!",
    "name": "QA测试用户",
    "phone": "13800138001",
    "role": "school_staff",
    "email": "qa_test_001@test.com"
  }')
echo "$CREATE_RESP" | python3 -m json.tool 2>/dev/null | head -20
USER_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
echo "Created User ID: $USER_ID"

echo ""
echo "=== 3. PUT /users/:id (Update User) ==="
if [ -n "$USER_ID" ]; then
  curl -s -X PUT "$BASE/users/$USER_ID" -H "$H" -H "$HC" \
    -d '{"name": "QA测试用户_已更新", "phone": "13800138002"}' | python3 -m json.tool 2>/dev/null | head -15
fi

echo ""
echo "=== 4. GET /roles (Role List) ==="
curl -s "$BASE/roles" -H "$H" | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "=== 5. POST /users/:id/role (Change Role) ==="
if [ -n "$USER_ID" ]; then
  curl -s -X POST "$BASE/users/$USER_ID/role" -H "$H" -H "$HC" \
    -d '{"role": "school_teacher"}' | python3 -m json.tool 2>/dev/null | head -15
fi

echo ""
echo "=== 6. DELETE /users/:id (Delete User) ==="
if [ -n "$USER_ID" ]; then
  curl -s -X DELETE "$BASE/users/$USER_ID" -H "$H" -w "\nHTTP Status: %{http_code}\n"
fi

echo ""
echo "=== 7. RBAC Test - Staff cannot create user ==="
curl -s -X POST "$BASE/users" -H "Authorization: Bearer $STAFF_TOKEN" -H "$HC" \
  -d '{"username":"hack_attempt","password":"Test123456!","name":"Hacker","role":"system_admin"}' \
  -w "\nHTTP Status: %{http_code}\n" | head -5

echo ""
echo "=== 8. GET /swagger.json ==="
curl -s "$BASE/docs-json" -w "\nHTTP Status: %{http_code}\n" | head -10

echo ""
echo "=== 9. POST /users - Validation Error ==="
curl -s -X POST "$BASE/users" -H "$H" -H "$HC" \
  -d '{"username":"","password":"123"}' | python3 -m json.tool 2>/dev/null | head -10
