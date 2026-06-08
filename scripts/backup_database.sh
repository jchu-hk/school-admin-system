#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/school_admin_${DATE}.sql"

mkdir -p ${BACKUP_DIR}

# 备份数据库
pg_dump -h localhost -U school_admin -d school_admin -f ${BACKUP_FILE}

# 压缩备份文件
gzip ${BACKUP_FILE}

# 删除7天前的备份
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: ${BACKUP_FILE}.gz"
