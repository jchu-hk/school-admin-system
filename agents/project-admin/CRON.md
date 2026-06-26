# Project Admin Agent Cron Job配置

## Cron Job

```cron
*/5 * * * * cd /workspace/projects/workspace/agents/project-admin && python3 main.py >> /tmp/project-admin.log 2>&1
```

## 说明

- 频率: 每5分钟
- 日志: `/tmp/project-admin.log`
- 任务:
  1. 检查所有in-progress Issues
  2. 监控Agent心跳
  3. 更新Dashboard
  4. 自动commit/push到GitHub

## 手动运行测试

```bash
cd /workspace/projects/workspace/agents/project-admin
python3 main.py
```

## 模拟Agent心跳

```bash
# DEV Agent开始工作
python3 main.py --write-heartbeat DEV 123 running "正在修复About页面"

# QA Agent开始工作
python3 main.py --write-heartbeat QA 158 running "验收About页面修复"

# DEV Agent完成工作
python3 main.py --write-heartbeat DEV 123 done "修复完成"
```