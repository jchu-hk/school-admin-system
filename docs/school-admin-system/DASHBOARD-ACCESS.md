# Project Wiki更新 - Dashboard访问URL

## Dashboard访问

**GitHub Raw (推荐用于htmlpreview)**:
https://raw.githubusercontent.com/jchu-hk/school-admin-system/main/multi-agent-dashboard.html

**GitHub Blob (查看源码)**:
https://github.com/jchu-hk/school-admin-system/blob/main/multi-agent-dashboard.html

**HTMLPreview (预览方式)**:
https://htmlpreview.github.io/?https://raw.githubusercontent.com/jchu-hk/school-admin-system/main/multi-agent-dashboard.html

**注意**: 使用 `raw.githubusercontent.com` 而不是 `github.com/blob`，因为blob会阻止JavaScript执行

---

## 实时数据

Dashboard每5分钟自动更新 (由Project Admin Agent管理)

**更新内容**:
- AI团队状态 (7个角色)
- 今日提交数
- 缺陷数
- 消息流活动
- 时间戳

**自动推送**: 每次更新自动commit/push到GitHub

---

## 相关Agent

- **PM Agent**: 任务分配、需求评审、战略决策
- **Project Admin Agent**: Dashboard更新、Agent协调、状态同步

**Agent文档**: `/workspace/projects/workspace/agents/project-admin/README.md`