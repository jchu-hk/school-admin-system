#!/usr/bin/env python3
"""Seed today's attendance records for human testing."""
import json
import random
import subprocess
import urllib.request
import urllib.error
import sys
from datetime import datetime, time

API_BASE = "http://localhost:3000/api"
TODAY = "2026-07-31"

# Test credentials
LOGIN_PAYLOAD = json.dumps({"username": "staff1", "password": "Admin123!"}).encode()

def api_request(method, path, data=None, token=None):
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ❌ HTTP {e.code}: {body[:200]}")
        return None

# 1. Login
print("🔑 Logging in as staff1...")
login_resp = api_request("POST", "/auth/login", LOGIN_PAYLOAD)
if not login_resp:
    print("❌ Login failed")
    sys.exit(1)
token = login_resp.get("access_token") or login_resp.get("data", {}).get("access_token")
if not token:
    print(f"❌ No token in response: {json.dumps(login_resp, indent=2)[:300]}")
    sys.exit(1)
print(f"✅ Token obtained")

# 2. Get active students with user IDs
print("\n📋 Fetching students...")
result = subprocess.run(
    ["docker", "exec", "school-admin-postgres", "psql", "-U", "school_admin", "-d", "school_admin",
     "-t", "-A", "-F", "|", "-c",
     "SELECT su.user_id, s.student_id, s.name_zh FROM student_users su JOIN students s ON su.student_id = s.id WHERE s.status = 'active' AND s.deleted_at IS NULL ORDER BY s.student_id LIMIT 50;"],
    capture_output=True, text=True, timeout=10
)

students = []
for line in result.stdout.strip().split('\n'):
    if not line.strip():
        continue
    parts = line.split('|')
    if len(parts) >= 3:
        students.append({
            "userId": parts[0].strip(),
            "studentNo": parts[1].strip(),
            "name": parts[2].strip()
        })

print(f"  Found {len(students)} active students")

if not students:
    print("❌ No students found")
    sys.exit(1)

# 3. Build attendance records with varied statuses
statuses = ["present", "present", "present", "present", "present",
            "present", "present", "present", "late", "absent",
            "absent_with_leave", "sick_leave"]

check_in_times = ["08:00", "08:05", "08:10", "08:00", "08:00",
                  "07:55", "08:02", "08:00", "08:25", None,
                  None, None]

print(f"\n📤 Creating {len(students)} individual attendance records...")
created = 0
failed = 0

for i, s in enumerate(students):
    status = statuses[i % len(statuses)]
    rec = {
        "studentId": s["userId"],
        "attendanceDate": TODAY,
        "status": status,
        "createdBy": "test"
    }
    
    if check_in_times[i % len(check_in_times)]:
        rec["checkInTime"] = check_in_times[i % len(check_in_times)]
        rec["attendanceType"] = "check_in"
    
    if status == "absent_with_leave":
        rec["remark"] = "家长请假"
    elif status == "sick_leave":
        rec["remark"] = "病假"
    elif status == "late":
        rec["remark"] = "迟到"
    
    data = json.dumps(rec).encode()
    result = api_request("POST", "/attendances", data, token)
    if result:
        created += 1
    else:
        failed += 1
    
    if (i + 1) % 10 == 0:
        print(f"  Progress: {i+1}/{len(students)} ({created} ok, {failed} failed)")

print(f"\n✅ Created: {created}, Failed: {failed}")

# 5. Verify
print("\n🔍 Verifying...")
verify = subprocess.run(
    ["docker", "exec", "school-admin-postgres", "psql", "-U", "school_admin", "-d", "school_admin",
     "-t", "-c",
     f"SELECT status, COUNT(*) FROM attendances WHERE attendance_date = '{TODAY}' AND deleted_at IS NULL GROUP BY status ORDER BY status;"],
    capture_output=True, text=True, timeout=10
)
print(f"  Today's attendance by status:")
for line in verify.stdout.strip().split('\n'):
    if line.strip():
        print(f"    {line.strip()}")

total = subprocess.run(
    ["docker", "exec", "school-admin-postgres", "psql", "-U", "school_admin", "-d", "school_admin",
     "-t", "-c",
     f"SELECT COUNT(*) FROM attendances WHERE attendance_date = '{TODAY}' AND deleted_at IS NULL;"],
    capture_output=True, text=True, timeout=10
)
print(f"\n  Total: {total.stdout.strip()} records for {TODAY}")
print("\n✅ Done!")
