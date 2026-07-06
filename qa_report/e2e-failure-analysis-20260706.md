# E2E测试失败分析报告（2026-07-06）

## 失败原因分类统计
| 类别 | 数量 | 说明 | 示例 |
|------|------|------|------|
| A | 18 | 测试用例选择器过时，需要更新测试 | 测试用例使用`getByTestId('field-name_zh')`，但实际前端字段标签为"中文姓名"且未配置对应testId；测试用`getByLabel('用户名')`但表单中无"用户名"字段，第一个字段为"中文姓名" |
| B | 7 | 前端缺少data-testid属性，需要修复前端 | 学生新增/编辑表单的`field-gender`、`field-birth_date`、`field-admission_date`、`btn-save`等字段未配置对应的data-testid属性 |
| C | 0 | 前端功能异常，需要修复BUG | 无明显功能异常，页面/弹窗加载正常，字段可交互 |

---

## 需要更新的测试用例清单（共18个）
| 用例ID | 测试文件 | 现有选择器 | 需修改为 | 优先级 |
|--------|----------|------------|----------|--------|
| SM-012 | student-management.spec.ts:278,279,282 | `getByTestId('field-name_zh')` | `getByLabel('中文姓名')` 或 前端添加对应testId后保持不变 | P0 |
| SM-013 | student-management.spec.ts:298,299 | `getByTestId('field-name_zh')` | `getByLabel('中文姓名')` | P0 |
| SM-014 | student-management.spec.ts:322,323 | `getByTestId('field-name_zh')` | `getByLabel('中文姓名')` | P0 |
| SM-015 | student-management.spec.ts:356 | `getByLabel('用户名')` | 删除该断言（无用户名字段）或修改为`getByLabel('中文姓名')` | P0 |
| SM-015 | student-management.spec.ts:357 | `getByLabel('姓名')` | `getByLabel('中文姓名')` | P0 |
| SM-016 | student-management.spec.ts:370,371 | `getByLabel('姓名')` | `getByLabel('中文姓名')` | P0 |
| SM-020 | student-management.spec.ts:443,444 | `getByTestId('field-name_zh')` + `getByLabel('姓名')` | `getByLabel('中文姓名')` | P0 |

---

## 需要修复的前端问题清单（共7个）
| 页面位置 | 字段/元素 | 需添加的data-testid | 优先级 |
|----------|-----------|---------------------|--------|
| 新增/编辑学生弹窗 | 姓名字段（中文姓名） | `field-name_zh` | P0 |
| 新增/编辑学生弹窗 | 性别选择器 | `field-gender` | P0 |
| 新增/编辑学生弹窗 | 出生日期字段 | `field-birth_date` | P0 |
| 新增/编辑学生弹窗 | 入学日期字段 | `field-admission_date` | P0 |
| 新增/编辑学生弹窗 | 保存按钮 | `btn-save` | P0 |
| 学生管理页面 | 班级筛选下拉框 | 建议添加`filter-class` | P1 |
| 学生管理页面 | 状态筛选下拉框 | 建议添加`filter-status` | P1 |

---

## 修复建议优先级
1. **P0（立即修复）**: 先在前端表单字段添加缺失的data-testid属性，同步更新测试用例中过时的选择器，预计可修复所有25个失败用例
2. **P1（后续优化）**: 为筛选下拉框添加testId，提升测试用例稳定性，避免依赖索引选择器
3. 无P2优先级问题