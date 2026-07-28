#!/usr/bin/env python3
"""Check remaining Chinese strings in 4 pages."""
import re

BASE = "/workspace/school-admin-system/school-admin-frontend/src/pages"

for fn in ['AttendancePage','FinanceScholarshipPage','LunchOrderPage','NotificationPage']:
    with open(f'{BASE}/{fn}.tsx') as fp:
        content = fp.read()
    
    # Count t.section.key references
    i18n_refs = len(re.findall(r"t\.\w+\.\w+", content))
    
    # Find lines with Chinese characters inside string literals  
    # We look for quoted strings that contain Chinese
    lines = content.split('\n')
    cn_string_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Skip comments
        if stripped.startswith('//') or stripped.startswith('*'):
            continue
        # Check if line has a string literal with Chinese
        # Match quoted strings
        matches = re.findall(r"""['"]([^'"]*[\u4e00-\u9fff]+[^'"]*)['"]""", line)
        if matches:
            cn_string_lines.append((i+1, matches))
    
    print(f"--- {fn} ---")
    print(f"  i18n refs: {i18n_refs}")
    print(f"  lines with CN strings: {len(cn_string_lines)}")
    for line_no, strs in cn_string_lines[:8]:
        print(f"    L{line_no}: {strs[:3]}")
    if len(cn_string_lines) > 8:
        print(f"    ... and {len(cn_string_lines)-8} more")
    print()
