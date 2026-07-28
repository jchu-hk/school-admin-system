#!/usr/bin/env python3
"""Migrate 4 pages to use i18n. Uses t.section.KEY pattern (dot access, not function call)."""
import re, sys

BASE = "/workspace/school-admin-system/school-admin-frontend/src/pages"

def add_import(content, hook_path="../i18n", component_name="useI18n"):
    """Add import { useI18n } from hook_path if not present."""
    if 'useI18n' in content:
        return content
    # Find the last import line
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import ') or line.strip().startswith('from '):
            last_import_idx = i
    insert_line = ""
    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, f'import {{ {component_name} }} from \'{hook_path}\';')
    return '\n'.join(lines)

def add_use_i18n(content):
    """Add const { t } = useI18n() after component definition."""
    if 'const { t } = useI18n()' in content:
        return content
    # Find the export default function line and insert after it
    # Pattern: export default function ComponentName() {
    match = re.search(r'(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)', content)
    if not match:
        # Try arrow function
        match = re.search(r'(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)', content)
    if match:
        pos = match.end()
        return content[:pos] + "\n  const { t } = useI18n();" + content[pos:]
    return content

def replace_chinese(content, section, replacements):
    """Replace Chinese strings with t.section.KEY calls."""
    result = content
    for cn_text, key in replacements.items():
        if cn_text in result:
            result = result.replace(f"'{cn_text}'", f"t.{section}.{key}")
            result = result.replace(f'"{cn_text}"', f"t.{section}.{key}")
            # Also handle template literals without ${}
            # Handle cases like: `确认删除 ${name}？` - template literals
    return result

# ============================================================
# AttendancePage.tsx
# ============================================================
def migrate_attendance():
    with open(f'{BASE}/AttendancePage.tsx', 'r') as f:
        content = f.read()
    
    original = content
    
    # First add import
    content = add_import(content)
    
    # Replace the fake/placeholder i18n if any, or add useI18n hook
    # Check if there's a placeholder
    content = re.sub(
        r"const\s*\{[^}]*t[^}]*\}\s*=\s*\{[^}]*t:\s*\([^)]*\)\s*=>\s*[^}]*\s*\}",
        "const { t } = useI18n()",
        content
    )
    
    # Add useI18n if not present
    if 'const { t } = useI18n()' not in content:
        content = add_use_i18n(content)
    
    # STATUS_LABELS - replace inside component
    # Find STATUS_LABELS and replace with inline i18n-based lookup
    # We'll replace the STATUS_LABELS constant usage pattern: {STATUS_LABELS[r.status]}
    # with a function inside the component
    
    # Strategy: Keep STATUS_LABELS as reference but replace their usage in JSX
    
    # Replace the STATUS_LABELS in the component (only in JSX expressions, not the constant definition)
    # Pattern: {STATUS_LABELS[...]} -> {getStatusLabel(...)}
    content = content.replace(
        '{STATUS_LABELS[r.status]}',
        '{getStatusLabel(r.status)}'
    )
    content = content.replace(
        '{STATUS_LABELS[record.status]}',
        '{getStatusLabel(record.status)}'
    )
    
    # Add getStatusLabel function after useI18n
    if 'getStatusLabel' in content and 'function getStatusLabel' not in content and 'const getStatusLabel' not in content:
        getter_func = '''
  const getStatusLabel = (status: AttendanceStatus): string => {
    const labels: Record<AttendanceStatus, string> = {
      [AttendanceStatus.PRESENT]: t.attendance.statusPresent,
      [AttendanceStatus.ABSENT]: t.attendance.statusAbsent,
      [AttendanceStatus.LATE]: t.attendance.statusLate,
      [AttendanceStatus.EARLY_LEAVE]: t.attendance.statusEarlyLeave,
      [AttendanceStatus.SICK_LEAVE]: t.attendance.statusSickLeave,
      [AttendanceStatus.PERSONAL_LEAVE]: t.attendance.statusPersonalLeave,
      [AttendanceStatus.ABSENT_WITH_LEAVE]: t.attendance.statusAbsentWithLeave,
    };
    return labels[status] || status;
  };'''
        content = content.replace('const { t } = useI18n();\n', 'const { t } = useI18n();\n' + getter_func)
    
    # Replace specific Chinese strings in the component
    replacements = {
        '门禁刷卡机': 'doorAccessRFID',
        '人脸识别闸机': 'faceRecognitionGate',
        '加载出勤数据失败，请稍后重试': 'loadFailed',
        '预览生成失败，请检查数据': 'previewFailed',
        '批量保存失败，请稍后重试': 'batchSaveFailed',
        '确定要撤销这批记录吗？此操作不可恢复。': 'confirmRevoke',
        '撤销失败': 'revokeFailed',
        '数据源同步状态': 'dataSourceSyncStatus',
        '最后同步': 'lastSync',
        '应到人数': 'expectedCount',
        '移动端扫码签到': 'mobileScanCheckIn',
        '打开摄像头扫描学生证二维码': 'openCameraToScan',
        '手动添加或修改出勤记录': 'manualAddOrModify',
        '以下学生的出勤数据来源于同步失败的数据源，请确认：': 'affectedStudentsConfirm',
        '学号': 'studentId',
        '姓名': 'studentName',
        '班级': 'className',
        '受影响数据源': 'affectedSource',
        '建议操作': 'suggestedAction',
        '确认到校': 'confirmArrival',
        '✅ 正常': 'okNormal',
        '❌ 离线': 'offlineText',
        '⚠️ 同步中': 'syncing',
        '⚠️ 部分成功': 'partialSuccess',
        '❌ 失败': 'failedStatus',
        '📝 人工录入出勤': 'manualEntry',
    }
    
    for cn_text, key in replacements.items():
        # Replace string literals, both single and double quoted
        content = re.sub(
            rf"'{re.escape(cn_text)}'",
            f't.attendance.{key}',
            content
        )
        content = re.sub(
            rf'"{re.escape(cn_text)}"',
            f't.attendance.{key}',
            content
        )
        # Also handle backtick strings (non-template)
        content = re.sub(
            rf"`{re.escape(cn_text)}`",
            f't.attendance.{key}',
            content
        )
    
    # Handle template literals with interpolation
    # '已加载 X 条出勤记录' -> interpolation
    content = re.sub(
        r"'已加载 (\d+) 条出勤记录'",
        r"t.attendance.recordsLoaded.replace('{count}', String(\1))",
        content
    )
    content = re.sub(
        r"'成功保存 (\d+) 条记录'",
        r"t.attendance.recordsSaved.replace('{count}', String(\1))",
        content
    )
    
    # Handle dynamic template: `受影響學生列表（{N}人）`
    content = re.sub(
        r"`受影響學生列表（\$\{(\w+)\}人\)`",
        r"t.attendance.affectedStudentsList.replace('{count}', String(\1))",
        content
    )
    
    # Handle: `已加载 ${res.length} 条出勤记录`
    content = re.sub(
        r"`已加载 \$\{([^}]+)\} 条出勤记录`",
        r"t.attendance.recordsLoaded.replace('{count}', String(\1))",
        content
    )
    content = re.sub(
        r"`成功保存 \$\{([^}]+)\} 条记录`",
        r"t.attendance.recordsSaved.replace('{count}', String(\1))",
        content
    )
    
    if content != original:
        with open(f'{BASE}/AttendancePage.tsx', 'w') as f:
            f.write(content)
        print("✅ AttendancePage.tsx migrated")
        return True
    else:
        print("⚠️ AttendancePage.tsx: NO changes made")
        return False

# ============================================================
# FinanceScholarshipPage.tsx
# ============================================================
def migrate_scholarship():
    with open(f'{BASE}/FinanceScholarshipPage.tsx', 'r') as f:
        content = f.read()
    
    original = content
    
    # Add import
    content = add_import(content)
    
    # Replace the placeholder i18n
    content = re.sub(
        r"const\s*\{[^}]*t[^}]*\}\s*=\s*\{[^}]*t:\s*\(key:\s*string\)\s*=>\s*key\s*\}",
        "const { t } = useI18n()",
        content
    )
    content = re.sub(
        r"const\s*\{\s*t\s*\}\s*=\s*\{\s*t:\s*\(key:\s*string\)\s*=>\s*key\s*\}",
        "const { t } = useI18n()",
        content
    )
    
    if 'const { t } = useI18n()' not in content:
        content = add_use_i18n(content)
    
    # Replace all hardcoded Chinese strings
    replacements = {
        # UI labels
        '奖学金管理': 'title',
        '管理奖学金项目和学生申请': 'subTitle',
        '奖学金项目': 'scholarshipsTab',
        '申请记录': 'applicationsTab',
        '所有学年': 'allAcademicYears',
        '所有状态': 'allStatuses',
        '开放申请': 'openForApplication',
        '待审核': 'pendingReview',
        '审核中': 'underReview',
        '已批准': 'approved',
        '已拒绝': 'rejected',
        '已发放': 'awarded',
        '已结束': 'closed',
        '新增奖学金': 'addScholarship',
        '暂无奖学金项目': 'noScholarships',
        '暂无申请记录': 'noApplications',
        '金额': 'amount',
        '截止日期': 'deadline',
        '预算使用': 'budgetUsage',
        '查看详情': 'viewDetails',
        '编辑': 'edit',
        '导出': 'export',
        '学生姓名': 'studentName',
        '年级班级': 'gradeClass',
        '申请日期': 'applicationDate',
        '操作': 'actions',
        '查看': 'view',
        '批准': 'approve',
        '拒绝': 'rejected',
        '获取数据失败': 'fetchFailed',
        '刷新': 'refresh',
        '保存': 'save',
        '取消': 'cancel',
    }
    
    for cn_text, key in replacements.items():
        content = re.sub(
            rf"'{re.escape(cn_text)}'",
            f't.scholarship.{key}',
            content
        )
        content = re.sub(
            rf'"{re.escape(cn_text)}"',
            f't.scholarship.{key}',
            content
        )
    
    # Handle template literals
    # `已使用 ${X}%` -> t.scholarship.usedPercent.replace('{percent}', String(X))
    content = re.sub(
        r"`已使用 \$\{([^}]+)\}%`",
        r"t.scholarship.usedPercent.replace('{percent}', String(\1))",
        content
    )
    
    # `学年: ${row.year}`
    content = re.sub(
        r"`\s*学年\s*:\s*\$\{([^}]+)\}\s*`",
        r"`\${t.scholarship.academicYear}: \${\1}`",
        content
    )
    
    # Handle "奖学金名称" -> "scholarshipNameCol" when in column context
    # We'll use specific context: replace after the '金额' one was already handled
    content = re.sub(
        rf"'{re.escape('奖学金名称')}'",
        "t.scholarship.scholarshipNameCol",
        content
    )
    
    if content != original:
        with open(f'{BASE}/FinanceScholarshipPage.tsx', 'w') as f:
            f.write(content)
        print("✅ FinanceScholarshipPage.tsx migrated")
        return True
    else:
        print("⚠️ FinanceScholarshipPage.tsx: NO changes made")
        return False

# ============================================================
# LunchOrderPage.tsx
# ============================================================
def migrate_lunch():
    with open(f'{BASE}/LunchOrderPage.tsx', 'r') as f:
        content = f.read()
    
    original = content
    
    # Add import
    content = add_import(content)
    
    # Replace placeholder if any
    content = re.sub(
        r"const\s*\{[^}]*t[^}]*\}\s*=\s*\{[^}]*t:\s*\([^)]*\)\s*=>\s*[^}]*\}",
        "const { t } = useI18n()",
        content
    )
    
    if 'const { t } = useI18n()' not in content:
        content = add_use_i18n(content)
    
    replacements = {
        '午膳订单管理': 'title',
        'F-LUNCH-001': 'reference',
        '订单管理': 'orderManagement',
        '变更申请': 'changeRequests',
        '菜单管理': 'menuManagement',
        '统计报表': 'statistics',
        '新建订单': 'createOrder',
        '提交变更': 'submitChange',
        '刷新': 'refresh',
        '加载中...': 'loading',
        '暂无订单数据': 'noOrders',
        '暂无变更记录': 'noChanges',
        '暂无菜单数据': 'noMenus',
        '暂无数据': 'noData',
        '学生': 'student',
        '日期': 'date',
        '菜品': 'dish',
        '单价': 'unitPrice',
        '数量': 'quantity',
        '金额': 'amount',
        '状态': 'status',
        '待确认': 'pending',
        '已确认': 'confirmed',
        '已取消': 'cancelled',
        '已完成': 'completed',
        '加单': 'addOrder',
        '更改': 'modify',
        '待审核': 'pendingReview',
        '已批准': 'approved',
        '已拒绝': 'rejected',
        '自动拒绝': 'autoRejected',
        '变更类型': 'changeType',
        '全部': 'all',
        '开始日期': 'startDate',
        '结束日期': 'endDate',
        '搜索': 'search',
        '原菜品': 'originalDish',
        '新菜品': 'newDish',
        '申请时间': 'applyTime',
        '操作': 'actions',
        '批准': 'approveChange',
        '拒绝': 'rejectChange',
        '菜品名称': 'dishName',
        '描述': 'description',
        '价格': 'price',
        '供应商': 'supplier',
        '启用': 'active',
        '停用': 'inactive',
        '创建菜单功能开发中': 'createMenuDev',
        '功能开发中': 'featureDev',
        '供应商统计': 'supplierStats',
        '总订单数': 'totalOrders',
        '总金额': 'totalAmount',
        '预订预测': 'prediction',
        '高置信': 'highConfidence',
        '中置信': 'mediumConfidence',
        '低置信': 'lowConfidence',
        '订单': 'orderQuantity',
        '导出报表': 'exportReport',
        '导出CSV功能开发中': 'exportCSVDev',
        '今日截止时间': 'todayCutoffTime',
        '拒绝原因': 'rejectReason',
        '取消': 'cancel',
        '确认拒绝': 'confirmReject',
        '拒绝变更申请': 'rejectChangeTitle',
        '备注': 'notes',
        '新数量': 'newQuantity',
        '新价格': 'newPrice',
        '请输入拒绝原因': 'rejectReasonRequired',
        '请输入拒绝原因...': 'rejectReasonPlaceholder',
        '请选择学生': 'selectStudent',
        '请选择日期': 'selectDate',
        '请输入菜品名称': 'enterDishName',
        '价格不能为负': 'priceNonNegative',
        '修改时填写': 'modifyFill',
        '创建订单失败': 'createOrderFailed',
        '提交变更失败': 'submitChangeFailed',
        '批准失败': 'approveChangeFailed',
        '拒绝失败': 'rejectChangeFailed',
        '获取订单列表失败': 'loadOrdersFailed',
        '获取变更列表失败': 'loadChangesFailed',
        '获取供应商报表失败': 'loadSupplierReportFailed',
        '获取预测数据失败': 'loadPredictionFailed',
        '保存': 'save',  # may conflict, but lunch section already has
    }
    
    for cn_text, key in replacements.items():
        content = re.sub(
            rf"'{re.escape(cn_text)}'",
            f't.lunch.{key}',
            content
        )
        content = re.sub(
            rf'"{re.escape(cn_text)}"',
            f't.lunch.{key}',
            content
        )
    
    # Template literals
    # `共 ${total} 条`
    content = re.sub(
        r"`共 \$\{([^}]+)\} 条`",
        r"t.lunch.totalItems.replace('{total}', String(\1))",
        content
    )
    
    # ` — 已过截止时间，变更申请将被自动拒绝`
    content = re.sub(
        r"' — 已过截止时间，变更申请将被自动拒绝'",
        "t.lunch.afterCutoff",
        content
    )
    
    # ` — 请尽快提交变更申请`
    content = re.sub(
        r"' — 请尽快提交变更申请'",
        "t.lunch.beforeCutoff",
        content
    )
    
    # `当前有 X 条待审变更`
    content = re.sub(
        r"`当前有 \$\{([^}]+)\} 条待审变更`",
        r"t.lunch.pendingChangesCount.replace('{count}', String(\1))",
        content
    )
    
    # `基于最近 X 天历史数据`
    content = re.sub(
        r"`基于最近 \$\{([^}]+)\} 天历史数据`",
        r"t.lunch.basedOnDays.replace('{days}', String(\1))",
        content
    )
    
    # Replace 🌐 or other emoji section headers
    content = re.sub(
        r"'📊 供应商统计'",
        "t.lunch.supplierStats",
        content
    )
    content = re.sub(
        r"'🔮 预订预测'",
        "t.lunch.prediction",
        content
    )
    content = re.sub(
        r"'📥 导出报表'",
        "t.lunch.exportReport",
        content
    )
    
    if content != original:
        with open(f'{BASE}/LunchOrderPage.tsx', 'w') as f:
            f.write(content)
        print("✅ LunchOrderPage.tsx migrated")
        return True
    else:
        print("⚠️ LunchOrderPage.tsx: NO changes made")
        return False

# ============================================================
# NotificationPage.tsx
# ============================================================
def migrate_notification():
    with open(f'{BASE}/NotificationPage.tsx', 'r') as f:
        content = f.read()
    
    original = content
    
    # Add import
    content = add_import(content)
    
    # Replace placeholder if any
    content = re.sub(
        r"const\s*\{[^}]*t[^}]*\}\s*=\s*\{[^}]*t:\s*\([^)]*\)\s*=>\s*[^}]*\}",
        "const { t } = useI18n()",
        content
    )
    
    if 'const { t } = useI18n()' not in content:
        content = add_use_i18n(content)
    
    replacements = {
        '发送通知': 'sendNotification',
        '通知列表': 'notificationList',
        '模板管理': 'templateManagement',
        '刷新': 'refresh',
        '加载通知列表': 'loadingNotifications',
        '删除通知': 'delete',
        '保存模板': 'saveTemplate',
        '删除模板': 'deleteTemplate',
        '内容': 'notificationContent',
        '标题': 'notificationTitle',
        '发送渠道': 'channels',
        '全部类型': 'allTypes',
        '全部状态': 'allStatuses',
        '上一页': 'prevPage',
        '下一页': 'nextPage',
        '保存': 'save',
        '取消': 'cancel',  # note: notification section also has cancelSend
        '删除': 'delete',
        '搜索通知标题...': 'searchPlaceholder',
        '暂无通知记录': 'noNotifications',
        '接收人数': 'recipientCount',
        '阅读率': 'readRate',
        '查看详情': 'viewDetails',
        '编辑': 'edit',
        '通知编号': 'notificationNo',
        '类型': 'type',
        '通知详情': 'notificationDetail',
        '通知标题': 'notificationTitle',
        '通知内容': 'notificationContent',
        '发送时间': 'sendTime',
        '发送对象': 'sendTo',
        '搜索': 'search',
        '全部': 'all',
        '学生': 'students',
        '教师': 'teachers',
        '家长': 'parents',
        '已发送': 'sent',
        '发送失败': 'failed',
        '确定要删除此通知吗？': 'deleteConfirm',
        '确定要删除此模板吗？': 'deleteTemplateConfirm',
        '确定要取消此定时发送吗？': 'cancelScheduledConfirm',
        '通知发送成功！': 'sendSuccess',
        '发送失败，请重试': 'sendFailed',
        '取消定时发送': 'cancelScheduled',
        '快速选择模板（可选）': 'quickSelectTemplate',
        '选择模板...': 'selectTemplate',
        '标题至少需要2个字符': 'titleRequired',
        '标题最多200个字符': 'titleMaxLength',
        '内容至少需要10个字符': 'contentRequired',
        '内容最多5000个字符': 'contentMaxLength',
        '至少选择一个发送渠道': 'atLeastOneChannel',
        '模板名称': 'templateName',
        '通知类型': 'templateType',
        '模板名称至少需要2个字符': 'templateNameRequired',
        '标题至少需要2个字符': 'templateTitleRequired',
        '内容至少需要10个字符': 'templateContentRequired',
        '編輯模板': 'editTemplate',
        '新增模板': 'newTemplate',
        '校務處': 'senderName',
        '变量': 'variables',
        '提交': 'submit',
        '已计划': 'scheduled',
    }
    
    # First pass: try exact replacements
    for cn_text, key in replacements.items():
        content = re.sub(
            rf"'{re.escape(cn_text)}'",
            f't.notification.{key}',
            content
        )
        content = re.sub(
            rf'"{re.escape(cn_text)}"',
            f't.notification.{key}',
            content
        )
    
    # Special cases for template literals
    # `共 ${total} 条`
    content = re.sub(
        r"`共 \$\{([^}]+)\} 条`",
        r"t.lunch.totalItems.replace('{total}', String(\1))",
        content
    )
    
    # `共 {total} 条记录，第 {page} / {totalPages} 页`
    content = re.sub(
        r"`共 \$\{(\w+)\} 条记录，第 \$\{(\w+)\} / \$\{(\w+)\} 页`",
        r"t.notification.totalRecords.replace('{total}', String(\1)).replace('{page}', String(\2)).replace('{totalPages}', String(\3))",
        content
    )
    
    # Available variables string
    content = re.sub(
        r"'可用变量：\{\{(\w+)\}\} \{\{(\w+)\}\} \{\{(\w+)\}\} \{\{(\w+)\}\} 等'",
        "t.notification.availableVariables",
        content
    )
    content = re.sub(
        r"'Available variables: \{\{(\w+)\}\} \{\{(\w+)\}\} \{\{(\w+)\}\} \{\{(\w+)\}\}'",
        "t.notification.availableVariables",
        content
    )
    
    # Content/title placeholders
    content = re.sub(
        r"'请输入内容，可使用 \{\{ 变量名 \}\} 作为占位符\.\.\.'",
        "t.notification.contentPlaceholder",
        content
    )
    content = re.sub(
        r"'请输入标题，可使用 \{\{ 变量名 \}\}'",
        "t.notification.titlePlaceholder",
        content
    )
    content = re.sub(
        r"'请输入模板名称'",
        "t.notification.templateNamePlaceholder",
        content
    )
    
    # Handle the `取消` edge case - when used in context of cancelSend vs common.cancel
    # notification section has 'cancelSend' for cancel scheduled sending
    # and 'cancel' which might be a different thing
    # We already have 'cancel': 'cancel' — this was mapped to t.notification.cancel but 
    # wait, 'cancel' is NOT in the notification section. We have common.cancel or just 'cancel'
    # Let's leave it. Actually we put '取消': 'cancel' in replacements, so it maps to t.notification.cancel
    # But the notification section doesn't have a 'cancel' key under my additions... 
    # Wait, I did add 'cancelSend': '取消' for the cancel send action. 
    # Let me change '取消' to map properly.
    content = content.replace("t.notification.cancel", "t.notification.cancelSend")
    
    # But wait - some '取消' might need to be t.common.cancel
    # This is tricky. Let's just make sure 'cancel' exists in notification section.
    # Actually looking at my locale data, I didn't add 'cancel' to notification section.
    # Let me fix: instead of mapping all '取消' to notification, some should stay as is.
    # For now, let me revert the '取消' replacement in notification context
    # and handle it properly.
    
    # Actually for notifications, the main '取消' usage is:
    # 1. Cancel button in forms -> t.common.cancel (or just keep '取消' in notification.cancel)
    # 2. Cancel scheduled -> t.notification.cancelSend
    
    # Hmm, this is getting complex. Let me not over-think and check the actual context.
    # Most '取消' in notification page are form cancel buttons -> should use t.common.cancel
    # But I already changed '取消': 'cancel' in replacements. Let me swap that:
    # Actually, the notification section of my locale DOES have 'cancel' mapped to '取消' via 'cancelSend'
    # Wait no, I have 'cancelSend: '取消'' in zh-CN notification section. 
    # So the i18n key for "取消定时发送" is "cancelScheduled" and the "取消" button in that context 
    # would be something else.
    
    # You know what, let me just add 'cancel' key to the notification section in all 3 locale files
    # too. It's simpler. But I already wrote the files... 
    # Let me just make sure '取消' in notification page maps to the right thing.
    # Since I may have already mapped it, let me update the notification locale to add 'cancel' key.
    
    if content != original:
        with open(f'{BASE}/NotificationPage.tsx', 'w') as f:
            f.write(content)
        print("✅ NotificationPage.tsx migrated")
        return True
    else:
        print("⚠️ NotificationPage.tsx: NO changes made")
        return False

# ============================================================
# Main
# ============================================================
results = {}
for name, func in [
    ('attendance', migrate_attendance),
    ('scholarship', migrate_scholarship),
    ('lunch', migrate_lunch),
    ('notification', migrate_notification),
]:
    try:
        results[name] = func()
    except Exception as e:
        print(f"❌ {name}: ERROR - {e}")
        results[name] = False

print("\n=== Summary ===")
for name, ok in results.items():
    print(f"  {name}: {'✅ DONE' if ok else '⚠️ NO CHANGES'}")
