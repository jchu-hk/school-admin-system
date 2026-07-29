# Fix Report — Issue #291

**日期**: 2026-07-29
**严重度**: P0
**Issue**: https://github.com/jchu-hk/school-admin-system/issues/291

## 问题
`GET /api/exams?page=1&pageSize=5` 返回 400 Bad Request

## 根因
HTTP 查询参数始终是字符串类型。`ExamQueryDto` 的 `@IsNumber()` 验证器无法处理字符串 `"1"`。

## 修复
在 `ExamQueryDto` 的 `page` 和 `pageSize` 字段添加 `@Type(() => Number)` 装饰器 (`class-transformer`)，在验证前将字符串转为数字。

文件: `apps/backend/src/modules/exam/dto/exam.dto.ts`

## 验证
- `GET /api/exams?page=1&pageSize=5` → 200 ✅
- `GET /api/exams` (无参数) → 200 ✅

## 状态
✅ 已关闭
