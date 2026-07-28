#!/usr/bin/env python3
"""Final pass - handle remaining hardcoded Chinese strings."""
import re

BASE = "/workspace/school-admin-system/school-admin-frontend/src/pages"

# ============================================================
# AttendancePage.tsx - remaining strings
# ============================================================
attendance_extra = {
    "保存中...": ("attendance", "saving"),
    "确认保存": ("attendance", "confirmSave"),
    "备注": ("attendance", "remark"),
    "生成预览...": ("attendance", "generatingPreview"),
    "生成确认预览": ("attendance", "confirmPreview"),
    "出勤概览": ("attendance", "overviewTab"),
    "人工录入": ("attendance", "manualTab"),
    "异常检测": ("attendance", "anomalyTab"),
    "出勤日期": ("attendance", "date"),
    "门禁刷卡机-RFID-001": ("attendance", "doorAccessRFID"),
    "门禁刷卡机-RFID-002": ("attendance", "doorAccessRFID"),
    "人脸识别闸机-FACE-001": ("attendance", "faceRecognitionGate"),
}

lunch_extra = {
    "取消/修改时填写": ("lunch", "modifyFill"),
}

notification_extra = {
    "請輸入通知內容...": ("notification", "contentPlaceholder"),
    "请输入通知内容...": ("notification", "contentPlaceholder"),
    "APP推送": ("notification", "channels"),
    "請輸入標題，可使用 {{變量名}}": ("notification", "titlePlaceholder"),
    "請輸入內容，可使用 {{變量名}} 作為佔位符...": ("notification", "contentPlaceholder"),
    "輸入標題...": ("notification", "titlePlaceholder"),
    "輸入內容...": ("notification", "contentPlaceholder"),
}

for filename, extras in [
    ("AttendancePage.tsx", attendance_extra),
    ("LunchOrderPage.tsx", lunch_extra),
    ("NotificationPage.tsx", notification_extra),
]:
    filepath = f"{BASE}/{filename}"
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for cn_text, (section, key) in sorted(extras.items(), key=lambda x: -len(x[0])):
        old = f"'{cn_text}'"
        new = f"t.{section}.{key}"
        while old in content:
            pos = content.find(old)
            if pos > 0 and content[pos-2:pos] == 't.':
                break
            content = content.replace(old, new, 1)
        
        old_dq = f'"{cn_text}"'
        while old_dq in content:
            pos = content.find(old_dq)
            if pos > 0 and content[pos-2:pos] == 't.':
                break
            content = content.replace(old_dq, new, 1)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ {filename}: additional replacements")
    else:
        print(f"⚠️ {filename}: no additional changes")

# Add missing keys to locale files
# Need to add 'saving', 'confirmSave', 'remark', 'generatingPreview', 'confirmPreview',
# 'overviewTab', 'manualTab', 'anomalyTab' to attendance section
# 'saving' to lunch section

locales = {
    "zh-CN": {
        "attendance": {
            "saving": "保存中...",
            "confirmSave": "确认保存",
            "remark": "备注",
            "generatingPreview": "生成预览...",
            "confirmPreview": "生成确认预览",
            "overviewTab": "出勤概览",
            "manualTab": "人工录入",
            "anomalyTab": "异常检测",
        },
        "lunch": {
            "saving": "保存中...",
        },
        "notification": {
            "notificationContentPlaceholder": "请输入通知内容...",
            "notificationTitlePlaceholder": "请输入通知标题...",
        }
    },
    "en": {
        "attendance": {
            "saving": "Saving...",
            "confirmSave": "Confirm Save",
            "remark": "Remarks",
            "generatingPreview": "Generating Preview...",
            "confirmPreview": "Generate Confirmation Preview",
            "overviewTab": "Attendance Overview",
            "manualTab": "Manual Entry",
            "anomalyTab": "Anomaly Detection",
        },
        "lunch": {
            "saving": "Saving...",
        },
        "notification": {
            "notificationContentPlaceholder": "Enter notification content...",
            "notificationTitlePlaceholder": "Enter notification title...",
        }
    },
    "zh-TW": {
        "attendance": {
            "saving": "儲存中...",
            "confirmSave": "確認儲存",
            "remark": "備註",
            "generatingPreview": "生成預覽...",
            "confirmPreview": "生成確認預覽",
            "overviewTab": "出勤概覽",
            "manualTab": "人工錄入",
            "anomalyTab": "異常檢測",
        },
        "lunch": {
            "saving": "儲存中...",
        },
        "notification": {
            "notificationContentPlaceholder": "請輸入通知內容...",
            "notificationTitlePlaceholder": "請輸入通知標題...",
        }
    }
}

locale_dir = "/workspace/school-admin-system/school-admin-frontend/src/i18n/locales"

for lang, sections in locales.items():
    filepath = f"{locale_dir}/{lang}.ts"
    with open(filepath, 'r') as f:
        content = f.read()
    
    for section, keys in sections.items():
        # Find the section closing bracket
        # Look for a key that already exists in that section to find the insertion point
        marker = f"{section}: {{"
        pos = content.find(marker)
        if pos >= 0:
            # Find the closing of the section (matching braces)
            open_braces = 1
            idx = pos + len(marker)
            while idx < len(content) and open_braces > 0:
                if content[idx] == '{':
                    open_braces += 1
                elif content[idx] == '}':
                    open_braces -= 1
                idx += 1
            insert_pos = idx - 1  # right before closing }
            
            additions = ""
            for key_name, key_value in keys.items():
                # Check if key already exists
                if f"{key_name}:" not in content[max(0, pos):insert_pos]:
                    additions += f"\n    {key_name}: '{key_value}',"
            
            if additions:
                content = content[:insert_pos] + additions + "\n  " + content[insert_pos:]
                print(f"  + {lang}.ts/{section}: added {len(keys)} keys")
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"✅ {lang}.ts updated")

print("\nDone!")
