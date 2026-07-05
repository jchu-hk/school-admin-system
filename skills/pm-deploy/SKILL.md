# PM Deploy Request Skill

**版本**: v1.0.0  
**职责**: PM 请求 DEVOPS 部署的标准化接口  
**原则**: 职责分离、标准化通信

## 核心原则

**PM 不执行部署，只请求部署**

```
PM (决策者) → DEVOPS (执行者)
```

## PM 部署请求命令

### 方式 1: 通过 Agent 通信

```bash
# PM 请求 DEVOPS 部署
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEVOPS \
  --message "[部署请求] 请部署最新代码到测试环境" \
  --type deploy --status pending

# PM 指定版本
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEVOPS \
  --message "[部署请求] 请部署 v1.5.6 到测试环境" \
  --type deploy --status pending
```

### 方式 2: 通过对话（DEVOPS Subagent）

PM 在对话中直接请求：

```
PM: "请部署最新代码到测试环境"
PM: "请部署 v1.5.6 到测试环境"
PM: "请回滚到 v1.5.5"
```

## PM 部署检查清单

在请求 DEVOPS 部署前，PM 确认：

| 检查项 | 确认 |
|--------|------|
| 代码已合并到 main | ☐ |
| 无阻塞 CI | ☐ |
| 已通知相关人 | ☐ |
| QA 已准备验收 | ☐ |

## DEVOPS 部署 Skill

实际部署由 `devops-deploy` Skill 执行：

```
skills/devops-deploy/
├── SKILL.md              # DEVOPS 部署文档
└── scripts/
    ├── full-deploy.sh    # 全量部署
    ├── deploy-frontend.sh
    ├── deploy-backend.sh
    └── verify-deployment.sh
```

## PM 工作流程

```
1. DEV 合并代码到 main
        ↓
2. PM 评估是否可以部署
        ↓
3. PM 请求 DEVOPS 部署
   → write_message.py 或直接对话
        ↓
4. DEVOPS 执行部署脚本
        ↓
5. DEVOPS 报告结果给 PM
        ↓
6. PM 通知 QA 验收
```

## 常见问题

**Q: PM 可以自己执行部署吗？**  
A: 不可以。部署是 DEVOPS 的职责，PM 只负责请求。

**Q: 紧急情况怎么办？**  
A: PM 标记为紧急，DEVOPS 优先处理。

**Q: 如何追踪部署历史？**  
A: 通过 `agent-communication` 的消息记录和 Dashboard。
