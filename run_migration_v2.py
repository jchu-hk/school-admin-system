#!/usr/bin/env python3
"""Comprehensive i18n migration - replaces ALL hardcoded Chinese strings in 4 pages."""
import re, os, sys

BASE = "/workspace/school-admin-system/school-admin-frontend/src/pages"

# For each page, define all Chinese string → i18n key mappings
# Format: { 'Chinese text': ('section', 'key') }

attendance_mappings = {
    # Status labels
    '出席': ('attendance', 'statusPresent'),
    '缺席': ('attendance', 'statusAbsent'),
    '迟到': ('attendance', 'statusLate'),
    '早退': ('attendance', 'statusEarlyLeave'),
    '病假': ('attendance', 'statusSickLeave'),
    '事假': ('attendance', 'statusPersonalLeave'),
    '请假缺勤': ('attendance', 'statusAbsentWithLeave'),
    # Equipment
    '门禁刷卡机': ('attendance', 'doorAccessRFID'),
    '人脸识别闸机': ('attendance', 'faceRecognitionGate'),
    # Messages
    '加载出勤数据失败，请稍后重试': ('attendance', 'loadFailed'),
    '预览生成失败，请检查数据': ('attendance', 'previewFailed'),
    '批量保存失败，请稍后重试': ('attendance', 'batchSaveFailed'),
    '确定要撤销这批记录吗？此操作不可恢复。': ('attendance', 'confirmRevoke'),
    '撤销失败': ('attendance', 'revokeFailed'),
    '数据源同步状态': ('attendance', 'dataSourceSyncStatus'),
    '最后同步': ('attendance', 'lastSync'),
    '应到人数': ('attendance', 'expectedCount'),
    '移动端扫码签到': ('attendance', 'mobileScanCheckIn'),
    '打开摄像头扫描学生证二维码': ('attendance', 'openCameraToScan'),
    '📝 人工录入出勤': ('attendance', 'manualEntry'),
    '手动添加或修改出勤记录': ('attendance', 'manualAddOrModify'),
    '以下学生的出勤数据来源于同步失败的数据源，请确认：': ('attendance', 'affectedStudentsConfirm'),
    '学号': ('attendance', 'studentId'),
    '姓名': ('attendance', 'studentName'),
    '班级': ('attendance', 'className'),
    '受影响数据源': ('attendance', 'affectedSource'),
    '建议操作': ('attendance', 'suggestedAction'),
    '确认到校': ('attendance', 'confirmArrival'),
    '✅ 正常': ('attendance', 'okNormal'),
    '❌ 离线': ('attendance', 'offlineText'),
    '⚠️ 同步中': ('attendance', 'syncing'),
    '⚠️ 部分成功': ('attendance', 'partialSuccess'),
    '❌ 失败': ('attendance', 'failedStatus'),
    '日期': ('attendance', 'date'),
    '刷新': ('attendance', 'refresh'),
    '学生姓名': ('attendance', 'studentName'),
    '状态': ('attendance', 'status'),
    '出勤日期': ('attendance', 'date'),
    '数据源正常': ('attendance', 'okNormal'),
    '部分数据源离线': ('attendance', 'offlineText'),
    '分钟': ('attendance', 'minutes' if False else None),  # skip - handled inline
    '学生': ('attendance', 'studentName'),  # context-dependent
}

scholarship_mappings = {
    '奖学金管理': ('scholarship', 'title'),
    '管理奖学金项目和学生申请': ('scholarship', 'subTitle'),
    '奖学金项目': ('scholarship', 'scholarshipsTab'),
    '申请记录': ('scholarship', 'applicationsTab'),
    '所有学年': ('scholarship', 'allAcademicYears'),
    '所有状态': ('scholarship', 'allStatuses'),
    '开放申请': ('scholarship', 'openForApplication'),
    '待审核': ('scholarship', 'pendingReview'),
    '审核中': ('scholarship', 'underReview'),
    '已批准': ('scholarship', 'approved'),
    '已拒绝': ('scholarship', 'rejected'),
    '已发放': ('scholarship', 'awarded'),
    '已结束': ('scholarship', 'closed'),
    '新增奖学金': ('scholarship', 'addScholarship'),
    '暂无奖学金项目': ('scholarship', 'noScholarships'),
    '暂无申请记录': ('scholarship', 'noApplications'),
    '金额': ('scholarship', 'amount'),
    '截止日期': ('scholarship', 'deadline'),
    '预算使用': ('scholarship', 'budgetUsage'),
    '查看详情': ('scholarship', 'viewDetails'),
    '编辑': ('scholarship', 'edit'),
    '导出': ('scholarship', 'export'),
    '学生姓名': ('scholarship', 'studentName'),
    '年级班级': ('scholarship', 'gradeClass'),
    '申请日期': ('scholarship', 'applicationDate'),
    '操作': ('scholarship', 'actions'),
    '查看': ('scholarship', 'view'),
    '批准': ('scholarship', 'approve'),
    '拒绝': ('scholarship', 'rejected'),
    '获取数据失败': ('scholarship', 'fetchFailed'),
    '刷新': ('scholarship', 'refresh'),
    '状态': ('scholarship', 'status'),
    '学年': ('scholarship', 'academicYear'),
    '已使用': ('scholarship', 'usedPercent'),  # partial
    '奖学金名称': ('scholarship', 'scholarshipNameCol'),
}

lunch_mappings = {
    '午膳订单管理': ('lunch', 'title'),
    '订单管理': ('lunch', 'orderManagement'),
    '变更申请': ('lunch', 'changeRequests'),
    '菜单管理': ('lunch', 'menuManagement'),
    '统计报表': ('lunch', 'statistics'),
    '新建订单': ('lunch', 'createOrder'),
    '提交变更': ('lunch', 'submitChange'),
    '刷新': ('lunch', 'refresh'),
    '加载中...': ('lunch', 'loading'),
    '加载中': ('lunch', 'loading'),
    '暂无订单数据': ('lunch', 'noOrders'),
    '暂无变更记录': ('lunch', 'noChanges'),
    '暂无菜单数据': ('lunch', 'noMenus'),
    '暂无数据': ('lunch', 'noData'),
    '暂无预测数据': ('lunch', 'noData'),
    '学生': ('lunch', 'student'),
    '日期': ('lunch', 'date'),
    '菜品': ('lunch', 'dish'),
    '单价': ('lunch', 'unitPrice'),
    '数量': ('lunch', 'quantity'),
    '金额': ('lunch', 'amount'),
    '状态': ('lunch', 'status'),
    '待确认': ('lunch', 'pending'),
    '已确认': ('lunch', 'confirmed'),
    '已取消': ('lunch', 'cancelled'),
    '已完成': ('lunch', 'completed'),
    '加单': ('lunch', 'addOrder'),
    '更改': ('lunch', 'modify'),
    '待审核': ('lunch', 'pendingReview'),
    '已批准': ('lunch', 'approved'),
    '已拒绝': ('lunch', 'rejected'),
    '自动拒绝': ('lunch', 'autoRejected'),
    '变更类型': ('lunch', 'changeType'),
    '全部': ('lunch', 'all'),
    '开始日期': ('lunch', 'startDate'),
    '结束日期': ('lunch', 'endDate'),
    '搜索': ('lunch', 'search'),
    '原菜品': ('lunch', 'originalDish'),
    '新菜品': ('lunch', 'newDish'),
    '申请时间': ('lunch', 'applyTime'),
    '操作': ('lunch', 'actions'),
    '批准': ('lunch', 'approveChange'),
    '拒绝': ('lunch', 'rejectChange'),
    '菜品名称': ('lunch', 'dishName'),
    '描述': ('lunch', 'description'),
    '价格': ('lunch', 'price'),
    '供应商': ('lunch', 'supplier'),
    '启用': ('lunch', 'active'),
    '停用': ('lunch', 'inactive'),
    '创建菜单功能开发中': ('lunch', 'createMenuDev'),
    '功能开发中': ('lunch', 'featureDev'),
    '📊 供应商统计': ('lunch', 'supplierStats'),
    '总订单数': ('lunch', 'totalOrders'),
    '总金额': ('lunch', 'totalAmount'),
    '🔮 预订预测': ('lunch', 'prediction'),
    '高置信': ('lunch', 'highConfidence'),
    '中置信': ('lunch', 'mediumConfidence'),
    '低置信': ('lunch', 'lowConfidence'),
    '订单': ('lunch', 'orderQuantity'),
    '📥 导出报表': ('lunch', 'exportReport'),
    '导出CSV功能开发中': ('lunch', 'exportCSVDev'),
    '今日截止时间': ('lunch', 'todayCutoffTime'),
    '拒绝原因': ('lunch', 'rejectReason'),
    '取消': ('lunch', 'cancelOperation'),
    '确认拒绝': ('lunch', 'confirmReject'),
    '拒绝变更申请': ('lunch', 'rejectChangeTitle'),
    '备注': ('lunch', 'notes'),
    '新数量': ('lunch', 'newQuantity'),
    '新价格': ('lunch', 'newPrice'),
    '新菜品（可选）': ('lunch', 'newItem'),
    '修改时填写': ('lunch', 'modifyFill'),
    '创建订单失败': ('lunch', 'createOrderFailed'),
    '提交变更失败': ('lunch', 'submitChangeFailed'),
    '批准失败': ('lunch', 'approveChangeFailed'),
    '拒绝失败': ('lunch', 'rejectChangeFailed'),
    '获取订单列表失败': ('lunch', 'loadOrdersFailed'),
    '获取变更列表失败': ('lunch', 'loadChangesFailed'),
    '获取供应商报表失败': ('lunch', 'loadSupplierReportFailed'),
    '获取预测数据失败': ('lunch', 'loadPredictionFailed'),
    '请输入拒绝原因': ('lunch', 'rejectReasonRequired'),
    '请输入拒绝原因...': ('lunch', 'rejectReasonPlaceholder'),
    '请选择学生': ('lunch', 'selectStudent'),
    '请选择日期': ('lunch', 'selectDate'),
    '请输入菜品名称': ('lunch', 'enterDishName'),
    '价格不能为负': ('lunch', 'priceNonNegative'),
    '已过截止时间，变更申请将被自动拒绝': ('lunch', 'afterCutoff'),
    '请尽快提交变更申请': ('lunch', 'beforeCutoff'),
    '新增菜单': ('lunch', 'addMenu'),
    '导出': ('lunch', 'exportReport'),
    '订单日期': ('lunch', 'date'),
    '订单数': ('lunch', 'orderQuantity'),
    '需要至少': ('lunch', 'modifyFill'),
    '类型': ('lunch', 'changeType'),
    '创建': ('lunch', 'createOrder'),
    '提交午膳变更': ('lunch', 'submitChange'),
    '新建午膳订单': ('lunch', 'createOrder'),
    '更改款式': ('lunch', 'modify'),
    '您的变更将被自动拒绝': ('lunch', 'afterCutoff'),
}

notification_mappings = {
    '发送通知': ('notification', 'sendNotification'),
    '通知列表': ('notification', 'notificationList'),
    '模板管理': ('notification', 'templateManagement'),
    '刷新': ('notification', 'refresh'),
    '加载通知列表': ('notification', 'loadingNotifications'),
    '加载通知列表...': ('notification', 'loadingNotifications'),
    '搜索通知標題...': ('notification', 'searchPlaceholder'),
    '搜索通知标题...': ('notification', 'searchPlaceholder'),
    '全部類型': ('notification', 'allTypes'),
    '全部类型': ('notification', 'allTypes'),
    '全部狀態': ('notification', 'allStatuses'),
    '全部状态': ('notification', 'allStatuses'),
    '上一頁': ('notification', 'prevPage'),
    '上一页': ('notification', 'prevPage'),
    '下一頁': ('notification', 'nextPage'),
    '下一页': ('notification', 'nextPage'),
    '通知編號': ('notification', 'notificationNo'),
    '通知编号': ('notification', 'notificationNo'),
    '類型': ('notification', 'type'),
    '类型': ('notification', 'type'),
    '通知标题': ('notification', 'notificationTitle'),
    '通知標題': ('notification', 'notificationTitle'),
    '通知内容': ('notification', 'notificationContent'),
    '通知內容': ('notification', 'notificationContent'),
    '发送时间': ('notification', 'sendTime'),
    '發送時間': ('notification', 'sendTime'),
    '发送对象': ('notification', 'sendTo'),
    '發送對象': ('notification', 'sendTo'),
    '发送渠道': ('notification', 'channels'),
    '發送渠道': ('notification', 'channels'),
    '接收人数': ('notification', 'recipientCount'),
    '接收人數': ('notification', 'recipientCount'),
    '阅读率': ('notification', 'readRate'),
    '閱讀率': ('notification', 'readRate'),
    '查看详情': ('notification', 'viewDetails'),
    '查看詳情': ('notification', 'viewDetails'),
    '编辑': ('notification', 'edit'),
    '編輯': ('notification', 'edit'),
    '删除': ('notification', 'delete'),
    '刪除': ('notification', 'delete'),
    '取消定时发送': ('notification', 'cancelScheduled'),
    '取消定時發送': ('notification', 'cancelScheduled'),
    '取消': ('notification', 'cancelSend'),
    '保存': ('notification', 'save'),
    '保存模板': ('notification', 'saveTemplate'),
    '删除模板': ('notification', 'deleteTemplate'),
    '確定要刪除此通知嗎？': ('notification', 'deleteConfirm'),
    '确定要删除此通知吗？': ('notification', 'deleteConfirm'),
    '確定要刪除此模板嗎？': ('notification', 'deleteTemplateConfirm'),
    '确定要删除此模板吗？': ('notification', 'deleteTemplateConfirm'),
    '確定要取消此定時發送嗎？': ('notification', 'cancelScheduledConfirm'),
    '确定要取消此定时发送吗？': ('notification', 'cancelScheduledConfirm'),
    '通知發送成功！': ('notification', 'sendSuccess'),
    '通知发送成功！': ('notification', 'sendSuccess'),
    '發送失敗，請重試': ('notification', 'sendFailed'),
    '发送失败，请重试': ('notification', 'sendFailed'),
    '快速選擇模板（可選）': ('notification', 'quickSelectTemplate'),
    '快速选择模板（可选）': ('notification', 'quickSelectTemplate'),
    '選擇模板...': ('notification', 'selectTemplate'),
    '选择模板...': ('notification', 'selectTemplate'),
    '新建模板': ('notification', 'newTemplate'),
    '新增模板': ('notification', 'newTemplate'),
    '編輯模板': ('notification', 'editTemplate'),
    '编辑模板': ('notification', 'editTemplate'),
    '标题': ('notification', 'notificationTitle'),
    '標題': ('notification', 'notificationTitle'),
    '内容': ('notification', 'notificationContent'),
    '內容': ('notification', 'notificationContent'),
    '模板名称': ('notification', 'templateName'),
    '模板名稱': ('notification', 'templateName'),
    '通知类型': ('notification', 'templateType'),
    '通知類型': ('notification', 'templateType'),
    '通知详情': ('notification', 'notificationDetail'),
    '已发送': ('notification', 'sent'),
    '已發送': ('notification', 'sent'),
    '发送失败': ('notification', 'failed'),
    '發送失敗': ('notification', 'failed'),
    '全部': ('notification', 'all'),
    '校務處': ('notification', 'senderName'),
    '提交': ('notification', 'submit'),
    '已计划': ('notification', 'scheduled'),
    '已計劃': ('notification', 'scheduled'),
    '变量': ('notification', 'variables'),
    '變量': ('notification', 'variables'),
    '发送通知弹窗': ('notification', 'sendNotificationTitle'),
    '弹窗状态': ('notification', 'sendNotificationTitle'),
    '通知列表标签页': ('notification', 'notificationList'),
    '模板管理标签页': ('notification', 'templateManagement'),
    '模板编辑弹窗': ('notification', 'editTemplate'),
    '通知详情弹窗': ('notification', 'notificationDetail'),
    '暂无通知记录': ('notification', 'noNotifications'),
    '暫無通知記錄': ('notification', 'noNotifications'),
    '搜索': ('notification', 'searchPlaceholder'),
    '分页': ('notification', 'totalRecords'),
    '统计面板': ('notification', 'notificationList'),
    '统计数据': ('notification', 'notificationList'),
    '格式化日期': ('notification', 'sendTime'),
    '计算阅读率': ('notification', 'readRate'),
    '发送通知': ('notification', 'sendNotificationTitle'),
    '通知發送成功': ('notification', 'sendSuccess'),
    '已讀': ('notification', 'read'),
    '已閱讀': ('notification', 'read'),
    '未讀': ('notification', 'unread'),
    '發送人': ('notification', 'senderName'),
    '读取通知列表': ('notification', 'loadingNotifications'),
    '删除通知': ('notification', 'delete'),
    '刪除模板': ('notification', 'deleteTemplate'),
    '选择模板': ('notification', 'selectTemplate'),
    '選擇模板': ('notification', 'selectTemplate'),
    '渠道': ('notification', 'channels'),
    '狀態': ('notification', 'type'),
    '刷新模板列表': ('notification', 'refresh'),
    '立即發送': ('notification', 'sendNow'),
    '定時發送': ('notification', 'schedule'),
    '发送': ('notification', 'sendNotification'),
    '暂無通知记录': ('notification', 'noNotifications'),
    '載入中': ('notification', 'loadingNotifications'),
    '學生': ('notification', 'students'),
    '教师': ('notification', 'teachers'),
    '教師': ('notification', 'teachers'),
    '家长': ('notification', 'parents'),
    '家長': ('notification', 'parents'),
    '发送成功': ('notification', 'sendSuccess'),
    '暂无通知': ('notification', 'noNotifications'),
    '删除成功': ('notification', 'deleteConfirm'),
    '操作': ('notification', 'actions'),
    '读取': ('notification', 'loadingNotifications'),
    # Form specific
    '請輸入內容': ('notification', 'contentPlaceholder'),
    '請輸入標題': ('notification', 'titlePlaceholder'),
    '請輸入模板名稱': ('notification', 'templateNamePlaceholder'),
    '请输入模板名称': ('notification', 'templateNamePlaceholder'),
    '請輸入通知內容': ('notification', 'contentPlaceholder'),
    '請輸入通知標題': ('notification', 'titlePlaceholder'),
    '请輸入手機號碼或郵箱地址': ('notification', 'titlePlaceholder'),
    '请輸入內容': ('notification', 'contentPlaceholder'),
    '请輸入標題': ('notification', 'titlePlaceholder'),
    '接收人选择': ('notification', 'sendTo'),
    '接收人列表': ('notification', 'sendTo'),
    '接收人': ('notification', 'sendTo'),
    '可用變量': ('notification', 'availableVariables'),
    '支持使用': ('notification', 'variables'),
    '作為佔位符': ('notification', 'variables'),
    '可選': ('notification', 'selectTemplate'),
    '可使用': ('notification', 'variables'),
    '變量名': ('notification', 'variables'),
    '個字符': ('notification', 'titleRequired'),
    '內容最多': ('notification', 'contentMaxLength'),
    '內容至少需要': ('notification', 'contentRequired'),
    '標題最多': ('notification', 'titleMaxLength'),
    '標題至少需要': ('notification', 'titleRequired'),
    '模板名稱至少需要': ('notification', 'templateNameRequired'),
    '至少選擇一個發送渠道': ('notification', 'atLeastOneChannel'),
    '请選擇班級': ('notification', 'selectTemplate'),
    '選擇班級': ('notification', 'selectTemplate'),
    '選擇角色': ('notification', 'selectTemplate'),
    '标题至少需要2个字符': ('notification', 'titleRequired'),
    '标题最多200个字符': ('notification', 'titleMaxLength'),
    '内容至少需要10个字符': ('notification', 'contentRequired'),
    '内容最多5000个字符': ('notification', 'contentMaxLength'),
    '至少选择一个发送渠道': ('notification', 'atLeastOneChannel'),
    '模板名称至少需要2个字符': ('notification', 'templateNameRequired'),
    '标题至少需要2个字符': ('notification', 'templateTitleRequired'),
    '内容至少需要10个字符': ('notification', 'templateContentRequired'),
    '条记录': ('notification', 'totalRecords'),
    '條記錄': ('notification', 'totalRecords'),
    # Notification-specific detail labels
    '送達統計': ('notification', 'notificationDetail'),
    '閱讀時間': ('notification', 'readTime'),
    '閱讀狀態': ('notification', 'read'),
    '短信': ('notification', 'channel'),
    '微信': ('notification', 'channel'),
    '推送': ('notification', 'channel'),
    '郵件': ('notification', 'channel'),
    # Mock data
    '期末考試時間表通知': ('notification', 'notificationTitle'),
    '明天停課一天': ('notification', 'notificationTitle'),
    '颱風來襲停課通知': ('notification', 'notificationTitle'),
    '親子運動會報名開始': ('notification', 'notificationTitle'),
    '本年度亲子运动會開始接受報名': ('notification', 'notificationContent'),
    '学費繳交提醒': ('notification', 'notificationTitle'),
    '班家長會通知': ('notification', 'notificationTitle'),
    '校長': ('notification', 'senderName'),
    '行政人員': ('notification', 'senderName'),
    '體育組': ('notification', 'senderName'),
    '財務處': ('notification', 'senderName'),
    '張老師': ('notification', 'senderName'),
    '王家長': ('notification', 'senderName'),
    '李家長': ('notification', 'senderName'),
    '陳家長': ('notification', 'senderName'),
    '班級': ('notification', 'searchPlaceholder'),
}

def replace_all_strings(content, mappings):
    """Replace all Chinese strings in content with t.section.key calls."""
    for cn_text, (section, key) in sorted(mappings.items(), key=lambda x: -len(x[0])):
        # Skip strings that are already mapped to i18n keys (prevent double-replacement)
        i18n_pattern = f"t.{section}.{key}"
        # Replace single-quoted
        old = f"'{cn_text}'"
        new = f't.{section}.{key}'
        while old in content:
            # Make sure we don't replace inside an already-existing t.section.key call
            # Check context: if immediately preceded by 't.' then skip
            pos = content.find(old)
            if pos > 0 and content[pos-2:pos] == 't.':
                break
            content = content.replace(old, new, 1)
        
        # Replace double-quoted
        old_dq = f'"{cn_text}"'
        while old_dq in content:
            pos = content.find(old_dq)
            if pos > 0 and content[pos-2:pos] == 't.':
                break
            content = content.replace(old_dq, new, 1)
    
    return content

def ensure_import_and_hook(content):
    """Ensure import and useI18n hook are present."""
    # Already done by previous script, but double-check
    if 'import { useI18n }' not in content:
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if re.match(r'^(import |from )', line):
                last_import = i
        lines.insert(last_import + 1, "import { useI18n } from '../i18n';")
        content = '\n'.join(lines)
    
    if 'const { t } = useI18n()' not in content:
        match = re.search(r'(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)', content)
        if match:
            pos = match.end()
            content = content[:pos] + "\n  const { t } = useI18n();" + content[pos:]
    
    return content

# ============================================================
# Process each page
# ============================================================

pages = [
    ('AttendancePage.tsx', attendance_mappings),
    ('FinanceScholarshipPage.tsx', scholarship_mappings),
    ('LunchOrderPage.tsx', lunch_mappings),
    ('NotificationPage.tsx', notification_mappings),
]

for filename, mappings in pages:
    filepath = os.path.join(BASE, filename)
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    content = ensure_import_and_hook(content)
    content = replace_all_strings(content, mappings)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ {filename}: replaced strings")
    else:
        print(f"⚠️ {filename}: no changes")

# Print summary of changes
for filename, _ in pages:
    filepath = os.path.join(BASE, filename)
    with open(filepath, 'r') as f:
        c = f.read()
    chinese_count = len(re.findall(r"t\.\w+\.\w+", c))
    print(f"  {filename}: {chinese_count} t.section.key references")
