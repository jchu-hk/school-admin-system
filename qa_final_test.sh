#!/bin/bash
BASE="https://hockey-deviant-brooks-litigation.trycloudflare.com/api"
OUT="/workspace/projects/workspace/qa_report/user_qa_results.txt"
mkdir -p /workspace/projects/workspace/qa_report

get_admin_token() {
  R=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"Admin123!"}')
  T=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('temp_token',''))")
  O=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('otpCode',''))")
  S=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sessionId',''))")
  curl -s -X POST "$BASE/auth/verify-otp" -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$S\",\"tempToken\":\"$T\",\"code\":\"$O\",\"otpType\":\"email\"}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))"
}

get_staff_token() {
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"username":"staff1","password":"Admin123!"}' | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))"
}

ADMIN_TOKEN=$(get_admin_token)
STAFF_TOKEN=$(get_staff_token)
H="Authorization: Bearer $ADMIN_TOKEN"
HC="Content-Type: application/json"
HF="Authorization: Bearer $STAFF_TOKEN"

echo "==== QA Results: $(date) ====" > "$OUT"

pass() { echo "  [PASS] $1"; echo "  [PASS] $1" >> "$OUT"; }
fail() { echo "  [FAIL] $1: $2"; echo "  [FAIL] $1: $2" >> "$OUT"; }
info() { echo "  [INFO] $1"; echo "  [INFO] $1" >> "$OUT"; }

run_test() {
  local name=$1; shift
  local expected=$1; shift
  local actual=$(eval "$@" 2>/dev/null)
  if echo "$actual" | grep -q "$expected"; then
    pass "$name"
  else
    fail "$name" "$actual"
  fi
}

echo "" >> "$OUT"
echo "=== 1. 用户CRUD功能 ===" >> "$OUT"

# 1.1 GET /users (list)
R=$(curl -s "$BASE/users?page=1&limit=3" -H "$H")
if echo "$R" | grep -q '"data"'; then
  pass "查询用户列表 - GET /users"
else
  fail "查询用户列表 - GET /users" "$R"
fi

# 1.2 GET /users/:id
STAFF_ID="4d1f5a4d-9d24-41cc-95bd-25e02442dde8"
R=$(curl -s "$BASE/users/$STAFF_ID" -H "$H")
if echo "$R" | grep -q '"username"'; then
  pass "查询单个用户 - GET /users/:id"
else
  fail "查询单个用户 - GET /users/:id" "$R"
fi

# 1.3 PATCH /users/:id (Update) - should work but returns 500
R=$(curl -s -X PATCH "$BASE/users/$STAFF_ID" -H "$H" -H "$HC" -d '{"name":"校务人员_QA测试"}')
if echo "$R" | grep -q "Internal server error"; then
  fail "更新用户 - PATCH /users/:id" "返回500内部错误"
else
  pass "更新用户 - PATCH /users/:id"
fi

# 1.4 DELETE /users/:id (soft delete)
# Create a user first, then delete
TMP_USER=$(curl -s -X POST "$BASE/users" -H "$H" -H "$HC" \
  -d '{"username":"qatemp_del_001","password":"Test123456!","name":"删除测试用户","role":"student"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
if [ -n "$TMP_USER" ]; then
  R=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/$TMP_USER" -H "$H")
  if [ "$R" = "204" ]; then
    pass "删除用户 - DELETE /users/:id (204 No Content)"
  else
    fail "删除用户 - DELETE /users/:id" "HTTP $R"
  fi
else
  info "删除用户 - 因POST /users返回500跳过"
fi

echo "" >> "$OUT"
echo "=== 2. 角色和权限 ===" >> "$OUT"

# 2.1 GET /roles
R=$(curl -s "$BASE/roles" -H "$H")
if echo "$R" | grep -q "system_admin"; then
  pass "角色列表 - GET /roles"
  echo "  Roles: $(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print([r['name'] for r in d])" 2>/dev/null)"
else
  fail "角色列表 - GET /roles" "$R"
fi

# 2.2 POST /users/:id/role - 验收范围说有这个，但实际不存在
R=$(curl -s -X POST "$BASE/users/$STAFF_ID/role" -H "$H" -H "$HC" -d '{"role":"school_staff"}' -w "\nHTTP:%{http_code}")
if echo "$R" | grep -q "404"; then
  fail "权限变更 - POST /users/:id/role" "端点不存在，返回404"
else
  pass "权限变更 - POST /users/:id/role"
fi

# 2.3 RBAC - Staff cannot create user
R=$(curl -s -X POST "$BASE/users" -H "$HF" -H "$HC" \
  -d '{"username":"hack","password":"Test123!","name":"Hack","role":"system_admin"}')
if echo "$R" | grep -q "403"; then
  pass "RBAC验证 - 校务无创建用户权限"
else
  fail "RBAC验证 - 校务无创建用户权限" "$R"
fi

echo "" >> "$OUT"
echo "=== 3. 账户管理 ===" >> "$OUT"

# 3.1 PATCH /users/:id/toggle-status
R=$(curl -s -X PATCH "$BASE/users/$STAFF_ID/toggle-status" -H "$H" -H "$HC" -d '{"status":"disabled"}')
if echo "$R" | grep -q "Internal server error"; then
  fail "账户状态管理 - toggle-status" "返回500内部错误"
else
  pass "账户状态管理 - toggle-status"
fi

# 3.2 PATCH /users/:id/reset-password
R=$(curl -s -X PATCH "$BASE/users/$STAFF_ID/reset-password" -H "$H" -H "$HC" -d '{"password":"TempNew123!"}')
if echo "$R" | grep -q "Internal server error"; then
  fail "密码重置 - reset-password" "返回500内部错误"
else
  pass "密码重置 - reset-password"
fi

# 3.3 GET /users/expiry-stats (过期预警)
R=$(curl -s "$BASE/users/expiry-stats" -H "$H")
if echo "$R" | grep -q "Internal server error"; then
  fail "过期预警机制 - expiry-stats" "返回500内部错误"
else
  pass "过期预警机制 - expiry-stats"
fi

# 3.4 POST /users/:id/handle-departure (离职处理)
R=$(curl -s -X POST "$BASE/users/$STAFF_ID/handle-departure" -H "$H" -H "$HC" \
  -d '{"departureDate":"2026-06-30","reason":"QA测试离职"}')
if echo "$R" | grep -q "500"; then
  fail "离职处理 - handle-departure" "返回500"
else
  pass "离职处理 - handle-departure"
fi

echo "" >> "$OUT"
echo "=== 4. 家长功能 ===" >> "$OUT"

# 4.1 GET /users?role=parent (家长列表)
R=$(curl -s "$BASE/users?role=parent&limit=3" -H "$H")
if echo "$R" | grep -q "parent"; then
  pass "家长列表 - GET /users?role=parent"
else
  fail "家长列表 - GET /users?role=parent" "$R"
fi

# 4.2 Check relatedStudentId field in parent users
STUDENT_ID=$(curl -s "$BASE/users?role=student&limit=1" -H "$H" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])" 2>/dev/null)
info "家长多子女绑定: relatedStudentId字段存在但所有家长为null（未关联学生）"
info "Student IDs available for linking: $STUDENT_ID"

# 4.3 Check /users/classes
R=$(curl -s "$BASE/users/classes" -H "$H")
if echo "$R" | grep -q "1A"; then
  pass "班级列表 - GET /users/classes"
else
  fail "班级列表 - GET /users/classes" "$R"
fi

echo "" >> "$OUT"
echo "=== 5. API文档 ===" >> "$OUT"

# 5.1 Swagger docs
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/docs")
if [ "$R" = "200" ] || [ "$R" = "301" ] || [ "$R" = "302" ]; then
  pass "Swagger文档 - /api/docs"
else
  fail "Swagger文档 - /api/docs" "HTTP $R"
fi

# 5.2 Swagger JSON
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/docs-json")
if [ "$R" = "200" ]; then
  pass "Swagger JSON - /api/docs-json"
else
  fail "Swagger JSON - /api/docs-json" "HTTP $R"
fi

echo "" >> "$OUT"
echo "=== 6. 额外验收 ===" >> "$OUT"

# GET /users/profile/me
R=$(curl -s "$BASE/users/profile/me" -H "$H")
if echo "$R" | grep -q '"username":"admin"'; then
  pass "当前用户信息 - GET /users/profile/me"
else
  fail "当前用户信息 - GET /users/profile/me" "$R"
fi

# Pagination
R=$(curl -s "$BASE/users?page=2&limit=2" -H "$H")
if echo "$R" | grep -q '"data"'; then
  pass "分页查询 - GET /users?page=2&limit=2"
else
  fail "分页查询" "$R"
fi

# Validation error
R=$(curl -s -X POST "$BASE/users" -H "$H" -H "$HC" -d '{"username":"","role":"invalid"}')
if echo "$R" | grep -q "400"; then
  pass "输入验证 - 无效输入返回400"
else
  fail "输入验证" "$R"
fi

echo ""
echo "==== Test Complete ===="
cat "$OUT"
