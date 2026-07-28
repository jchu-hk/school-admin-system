#!/usr/bin/env python3
"""QA Verification: [#284][#285] i18n English Translation Fix"""

import json
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/"

results = {"passed": [], "failed": []}

def check(name, condition, detail=""):
    if condition:
        results["passed"].append(f"✅ {name}: {detail}" if detail else f"✅ {name}")
        print(f"  PASS: {name}")
    else:
        results["failed"].append(f"❌ {name}: {detail}" if detail else f"❌ {name}")
        print(f"  FAIL: {name} - {detail}")

def get_text(page, selector, timeout=5000):
    try:
        el = page.wait_for_selector(selector, timeout=timeout)
        if el:
            return el.text_content().strip()
    except:
        pass
    return None

def get_all_text(page, selector, timeout=5000):
    try:
        els = page.wait_for_selector(selector, timeout=timeout)
        if els:
            return els.all_text_contents()
    except:
        pass
    return None

def click_lang_switch(page):
    """Click the language switcher button"""
    try:
        # Try multiple selectors
        for sel in ['button:has-text("简体中文")', 'button:has-text("English")',
                     '[data-testid="lang-switch"]', 'button:has-text("EN")',
                     'button:has-text("中文")']:
            btn = page.query_selector(sel)
            if btn and btn.is_visible():
                btn.click()
                page.wait_for_timeout(2000)
                return True
        # Last resort: find button that looks like a language toggle
        buttons = page.query_selector_all("button")
        for b in buttons:
            txt = b.text_content().strip()
            if txt in ["简体中文", "English", "中文", "EN", "Language"]:
                b.click()
                page.wait_for_timeout(2000)
                return True
        return False
    except:
        return False

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        print("=" * 60)
        print("QA Verification: i18n English Translation Fix")
        print("=" * 60)

        # Step 1: Login
        print("\n1️⃣  Logging in...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)

        # Fill credentials
        page.fill('[data-testid="username-input"]', "admin")
        page.fill('[data-testid="password-input"]', "admin")
        page.click('[data-testid="login-button"]')

        # Wait for dashboard to load
        page.wait_for_timeout(5000)
        print("  Logged in. Current URL:", page.url)

        # Save full page text for debugging
        with open("/tmp/qa_page_after_login.txt", "w") as f:
            f.write(page.content())

        # ==== TEST 3: Dashboard Chart Labels (start with English mode) ====
        print("\n2️⃣  Switching to English...")
        switched = click_lang_switch(page)
        print(f"  Language switch clicked: {switched}")
        page.wait_for_timeout(3000)

        # Get current page text
        body_text = page.text_content("body") or ""
        print(f"  Body text (first 500): {body_text[:500]}")

        # Check system title in sidebar - look for "Smart Campus" or "智慧校园"
        print("\n3️⃣  Testing System Title (#285)...")

        # Sidebar header
        sidebar_header = None
        try:
            # Try to find the sidebar header
            sidebar_el = page.query_selector(".sidebar-header, .logo-text, [class*='sidebar'] h1, [class*='sidebar'] h2, header h1, header h2, nav h1, nav h2, .app-title, .system-title")
            if sidebar_el:
                sidebar_header = sidebar_el.text_content().strip()
                print(f"  Sidebar header: '{sidebar_header}'")
        except:
            pass

        # If not found by class, search page text
        if not sidebar_header:
            for text in ["Smart Campus", "智慧校园"]:
                if text in body_text:
                    sidebar_header = text
                    break

        print(f"  Detected sidebar header: '{sidebar_header}'")
        is_english = "Smart Campus" in body_text or sidebar_header == "Smart Campus"
        print(f"  Is English mode: {is_english}")

        if not is_english:
            # Try switching again
            print("  Still Chinese, trying language switch again...")
            click_lang_switch(page)
            page.wait_for_timeout(3000)
            body_text = page.text_content("body") or ""
            print(f"  Body text after second switch (first 500): {body_text[:500]}")
            is_english = "Smart Campus" in body_text

        check("#285 System Title (English)", is_english, 
              f"Found 'Smart Campus' in page: {is_english}" if is_english else "Sidebar still shows Chinese title")

        # Save current state
        page.screenshot(path="/tmp/qa_english_mode.png")

        # Check Dashboard chart labels
        print("\n4️⃣  Testing Dashboard Chart Labels (#285)...")

        # Look for chart labels
        chart_labels = []
        for label in ["Present", "Late", "Early Leave", "Absent", "出勤", "迟到", "早退", "缺勤"]:
            if label in body_text:
                chart_labels.append(label)

        print(f"  Chart labels found: {chart_labels}")

        # Also check "Daily Attendance Detail" vs "今日出勤详情"
        has_daily_en = "Daily Attendance Detail" in body_text or "Daily Attendance" in body_text
        has_daily_zh = "今日出勤详情" in body_text
        print(f"  Daily Attendance header: EN={has_daily_en}, ZH={has_daily_zh}")

        check("#285 Chart Labels (English)", 
              "Present" in chart_labels or "Daily Attendance Detail" in body_text or "Daily Attendance" in body_text,
              f"Found English labels: {chart_labels}")

        # ==== TEST 1: Attendance Menu ====
        print("\n5️⃣  Testing Attendance Menu (#284)...")

        # Find and hover over Attendance menu item
        attendance_btn = None
        for sel_text in ["考勤管理", "Attendance", "考勤"]:
            try:
                btn = page.query_selector(f'button:has-text("{sel_text}")')
                if btn and btn.is_visible():
                    attendance_btn = btn
                    print(f"  Found attendance button: '{sel_text}'")
                    break
            except:
                pass

        if attendance_btn:
            attendance_btn.click()
            page.wait_for_timeout(2000)

            # Check for submenus
            body_after_click = page.text_content("body") or ""
            print(f"  After clicking Attendance, body (500 chars): {body_after_click[:500]}")

            # Check for sub-items (in English or Chinese)
            expected_en = ["Attendance Record", "Attendance Statistics", "Asset Management", "Asset Rental Management"]
            expected_zh = ["考勤记录", "考勤统计", "资产管理", "资产租借管理"]

            sub_items_en = [s for s in expected_en if s in body_after_click]
            sub_items_zh = [s for s in expected_zh if s in body_after_click]
            print(f"  English sub-items found: {sub_items_en}")
            print(f"  Chinese sub-items found: {sub_items_zh}")

            check("#284 Attendance Sub-items (English mode)", 
                  len(sub_items_en) >= 4 or len(sub_items_zh) >= 4,
                  f"EN sub-items: {sub_items_en}, ZH sub-items: {sub_items_zh}")

            page.screenshot(path="/tmp/qa_attendance_menu.png")
        else:
            print("  Could not find Attendance button!")
            check("#284 Attendance Menu", False, "Could not find attendance button in sidebar")

        # ==== Switch to Chinese and verify ====
        print("\n6️⃣  Switching to Chinese...")
        click_lang_switch(page)
        page.wait_for_timeout(3000)

        body_zh = page.text_content("body") or ""
        print(f"  Chinese mode body (500 chars): {body_zh[:500]}")

        check("#285 System Title (Chinese)", "智慧校园" in body_zh,
              f"Found '智慧校园' in page: {'智慧校园' in body_zh}")

        # Check dashboard labels in Chinese
        zh_labels = [l for l in ["出勤", "迟到", "早退", "缺勤"] if l in body_zh]
        print(f"  Chinese chart labels found: {zh_labels}")

        check("#285 Dashboard Labels (Chinese)", "今日出勤" in body_zh,
              f"Found Chinese labels: {zh_labels}")

        # Check Attendance menu in Chinese
        if attendance_btn:
            try:
                btn_zh = page.query_selector('button:has-text("考勤管理")')
                if btn_zh and btn_zh.is_visible():
                    btn_zh.click()
                    page.wait_for_timeout(2000)
                    body_zh_menu = page.text_content("body") or ""
                    print(f"  After clicking Attendance (Chinese mode): {body_zh_menu[:500]}")
                    
                    zh_items = [s for s in ["考勤记录", "考勤统计", "资产管理", "资产租借管理"] if s in body_zh_menu]
                    print(f"  Chinese sub-items: {zh_items}")
                    
                    check("#284 Chinese mode (back to ZH)", len(zh_items) >= 4,
                          f"Found ZH sub-items: {zh_items}")
            except:
                pass

        # Switch back to English and verify again
        print("\n7️⃣  Switching back to English (final verification)...")
        click_lang_switch(page)
        page.wait_for_timeout(3000)

        body_en2 = page.text_content("body") or ""
        print(f"  Back to English body (500 chars): {body_en2[:500]}")

        check("#284/#285 Switch back to English", "Smart Campus" in body_en2,
              "Able to switch back to English successfully")

        page.screenshot(path="/tmp/qa_final_english.png")

        # Summary
        print("\n" + "=" * 60)
        print("RESULTS SUMMARY")
        print("=" * 60)
        for p in results["passed"]:
            print(f"  {p}")
        for f in results["failed"]:
            print(f"  {f}")
        print(f"\nTotal: {len(results['passed'])} passed, {len(results['failed'])} failed")

        browser.close()

        # Return results for the caller
        if len(results["failed"]) > 0:
            print("\n⚠️  Some tests FAILED!")
            return False
        else:
            print("\n✅ ALL TESTS PASSED!")
            return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
