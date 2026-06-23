#!/bin/bash
#
# 每日出勤测试数据生成脚本
# 用法: ./scripts/seed-daily-attendance.sh
# 建议: 添加到 crontab: 0 0 * * * /workspace/projects/workspace/scripts/seed-daily-attendance.sh
#

# 数据库配置
DB_NAME="school_admin"
DB_USER="school_admin"

# 使用本地时区日期
TODAY=$(date +%Y-%m-%d)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  每日出勤测试数据生成${NC}"
echo -e "${BLUE}  日期: ${TODAY}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 查找 postgres 容器
CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep -i postgres | head -1)
if [ -z "$CONTAINER_NAME" ]; then
    echo -e "${RED}错误: 未找到 postgres 容器${NC}"
    exit 1
fi

echo -e "${YELLOW}使用容器: ${CONTAINER_NAME}${NC}"
echo ""

# 生成早上时间 (07:40 - 08:30)
generate_morning_time() {
    local min=$((RANDOM % 51 + 460))
    local hour=$((min / 60))
    local minute=$((min % 60))
    local second=$((RANDOM % 60))
    printf "%02d:%02d:%02d" $hour $minute $second
}

# 生成下午时间 (15:00 - 15:30)
generate_afternoon_time() {
    local min=$((RANDOM % 31 + 900))
    local hour=$((min / 60))
    local minute=$((min % 60))
    local second=$((RANDOM % 60))
    printf "%02d:%02d:%02d" $hour $minute $second
}

# 生成迟到时间 (08:00 - 08:30)
generate_late_time() {
    local min=$((RANDOM % 31 + 480))
    local hour=$((min / 60))
    local minute=$((min % 60))
    local second=$((RANDOM % 60))
    printf "%02d:%02d:%02d" $hour $minute $second
}

# 初始化统计
declare -A STATUS_COUNTS
STATUS_COUNTS["present"]=0
STATUS_COUNTS["late"]=0
STATUS_COUNTS["leave_early"]=0
STATUS_COUNTS["absent"]=0
TOTAL=0

# 删除当天的旧记录
echo -e "${YELLOW}清理 ${TODAY} 的旧出勤记录...${NC}"
cat > /tmp/cleanup.sql << EOF
DELETE FROM attendances WHERE attendance_date = '$TODAY' AND sync_source = 'MANUAL';
EOF
docker cp /tmp/cleanup.sql "$CONTAINER_NAME:/tmp/cleanup.sql"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/cleanup.sql > /dev/null 2>&1
rm -f /tmp/cleanup.sql
echo -e "${GREEN}✓ 旧记录已清理${NC}"
echo ""

# 生成并执行插入 SQL
echo -e "${YELLOW}生成出勤记录...${NC}"

# 班级1: 1A班 (学生1, 学生2)
echo -e "${BLUE}处理班级: 1A班${NC}"
STUDENT1_ID="29e999e3-7844-46eb-a249-44a18a6f982d"
STUDENT2_ID="0133b92f-269b-4880-a4ab-ac51a0d2c6e1"
CLASS_ID1="11111111-1111-1111-1111-111111111111"

cat > /tmp/insert_1a.sql << EOF
INSERT INTO attendances (student_id, class_id, attendance_date, check_in_time, check_out_time, status, attendance_type, remark, created_by, updated_by)
VALUES 
    ('$STUDENT1_ID', '$CLASS_ID1', '$TODAY', '$(generate_morning_time)', '$(generate_afternoon_time)', 'present', 'check_in', '自动化生成测试数据', 'system', 'system'),
    ('$STUDENT2_ID', '$CLASS_ID1', '$TODAY', '$(generate_morning_time)', '$(generate_afternoon_time)', 'present', 'check_in', '自动化生成测试数据', 'system', 'system');
EOF
docker cp /tmp/insert_1a.sql "$CONTAINER_NAME:/tmp/insert_1a.sql"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/insert_1a.sql > /dev/null 2>&1
rm -f /tmp/insert_1a.sql
echo -e "    ${GREEN}✓${NC} $STUDENT1_ID -> present"
echo -e "    ${GREEN}✓${NC} $STUDENT2_ID -> present"
STATUS_COUNTS["present"]=$((STATUS_COUNTS["present"] + 2))
TOTAL=$((TOTAL + 2))
echo ""

# 班级2: 2A班 (学生3, 学生4)
echo -e "${BLUE}处理班级: 2A班${NC}"
STUDENT3_ID="3512932d-8ef4-435a-b690-d8e6966b6973"
STUDENT4_ID="d66f9810-6c8a-4e4e-9fc9-d566e7aa1e7f"
CLASS_ID2="22222222-2222-2222-2222-222222222222"

cat > /tmp/insert_2a.sql << EOF
INSERT INTO attendances (student_id, class_id, attendance_date, check_in_time, check_out_time, status, attendance_type, remark, created_by, updated_by)
VALUES 
    ('$STUDENT3_ID', '$CLASS_ID2', '$TODAY', '$(generate_morning_time)', '$(generate_afternoon_time)', 'present', 'check_in', '自动化生成测试数据', 'system', 'system'),
    ('$STUDENT4_ID', '$CLASS_ID2', '$TODAY', '$(generate_late_time)', '$(generate_afternoon_time)', 'late', 'check_in', '自动化生成测试数据', 'system', 'system');
EOF
docker cp /tmp/insert_2a.sql "$CONTAINER_NAME:/tmp/insert_2a.sql"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/insert_2a.sql > /dev/null 2>&1
rm -f /tmp/insert_2a.sql
echo -e "    ${GREEN}✓${NC} $STUDENT3_ID -> present"
echo -e "    ${GREEN}✓${NC} $STUDENT4_ID -> late"
STATUS_COUNTS["present"]=$((STATUS_COUNTS["present"] + 1))
STATUS_COUNTS["late"]=$((STATUS_COUNTS["late"] + 1))
TOTAL=$((TOTAL + 2))
echo ""

# student1 (无班级)
echo -e "${BLUE}处理班级: 无班级 (student1)${NC}"
STUDENT5_ID="550e8400-e29b-41d4-a716-446655440004"

cat > /tmp/insert_other.sql << EOF
INSERT INTO attendances (student_id, class_id, attendance_date, check_in_time, check_out_time, status, attendance_type, remark, created_by, updated_by)
VALUES ('$STUDENT5_ID', NULL, '$TODAY', '$(generate_morning_time)', '$(generate_afternoon_time)', 'present', 'check_in', '自动化生成测试数据', 'system', 'system');
EOF
docker cp /tmp/insert_other.sql "$CONTAINER_NAME:/tmp/insert_other.sql"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/insert_other.sql > /dev/null 2>&1
rm -f /tmp/insert_other.sql
echo -e "    ${GREEN}✓${NC} $STUDENT5_ID -> present"
STATUS_COUNTS["present"]=$((STATUS_COUNTS["present"] + 1))
TOTAL=$((TOTAL + 1))
echo ""

# 输出统计
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  生成完成！${NC}"
echo -e "${BLUE}  日期: ${TODAY}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "状态分布:"
echo -e "  ${GREEN}present${NC} (正常):      ${STATUS_COUNTS[present]} 条"
echo -e "  ${YELLOW}late${NC} (迟到):        ${STATUS_COUNTS[late]} 条"
echo -e "  ${BLUE}leave_early${NC} (早退):  ${STATUS_COUNTS[leave_early]} 条"
echo -e "  ${RED}absent${NC} (缺勤):       ${STATUS_COUNTS[absent]} 条"
echo ""
echo -e "${GREEN}总计: ${TOTAL} 条出勤记录${NC}"
echo ""

# 验证插入
echo -e "${YELLOW}验证数据...${NC}"
cat > /tmp/verify.sql << EOF
SELECT 
    u.name as student_name,
    COALESCE(c.name, '无班级') as class_name,
    a.status,
    a.check_in_time,
    a.check_out_time
FROM attendances a
JOIN users u ON a.student_id = u.id
LEFT JOIN classes c ON a.class_id::uuid = c.id
WHERE a.attendance_date = '$TODAY'
ORDER BY c.name, u.name;
EOF
docker cp /tmp/verify.sql "$CONTAINER_NAME:/tmp/verify.sql"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/verify.sql
rm -f /tmp/verify.sql
echo ""

echo -e "${GREEN}✓ 每日出勤测试数据生成完成！${NC}"
