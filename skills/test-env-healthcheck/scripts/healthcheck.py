#!/usr/bin/env python3
"""
Token-free testing environment health check.
Monitors endpoints, response times, error rates.

Usage: python healthcheck.py
Cron: */5 * * * * python3 healthcheck.py >> /tmp/healthcheck.log 2>&1
"""

import json
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
import subprocess

SCRIPT_DIR = Path(__file__).parent
CONFIG_FILE = SCRIPT_DIR / "healthcheck_config.json"
HISTORY_FILE = SCRIPT_DIR / "healthcheck_history.json"
FAILURES_FILE = SCRIPT_DIR / "healthcheck_failures.json"

def load_config():
    """Load configuration"""
    try:
        with open(CONFIG_FILE) as f:
            return json.load(f)
    except:
        print(f"❌ Cannot load config from {CONFIG_FILE}")
        sys.exit(1)

def check_endpoint(name: str, config: dict) -> dict:
    """Check a single endpoint"""
    url = config.get("url", "")
    timeout = config.get("timeout", 5)
    expected_status = config.get("expected_status", 200)
    critical = config.get("critical", False)
    
    result = {
        "name": name,
        "url": url,
        "status": "unknown",
        "response_time_ms": None,
        "status_code": None,
        "error": None,
        "critical": critical,
        "checked_at": datetime.now(timezone.utc).isoformat()
    }
    
    start_time = time.time()
    
    try:
        # Use curl instead of requests to avoid dependencies
        r = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", 
             "--max-time", str(timeout), url],
            capture_output=True,
            timeout=timeout + 2
        )
        
        response_time_ms = int((time.time() - start_time) * 1000)
        result["response_time_ms"] = response_time_ms
        result["status_code"] = int(r.stdout.strip().decode()) if r.stdout else None
        
        # Check status code
        if result["status_code"] == expected_status:
            result["status"] = "ok"
        else:
            result["status"] = "critical" if critical else "warning"
            result["error"] = f"Unexpected status code: {result['status_code']} (expected {expected_status})"
            
    except subprocess.TimeoutExpired:
        result["status"] = "critical" if critical else "warning"
        result["error"] = f"Timeout after {timeout}s"
        result["response_time_ms"] = timeout * 1000
        
    except Exception as e:
        result["status"] = "critical" if critical else "warning"
        result["error"] = str(e)
    
    return result

def load_failures():
    """Load failure tracking"""
    try:
        with open(FAILURES_FILE) as f:
            return json.load(f)
    except:
        return {"consecutive_failures": 0, "last_failure_time": None}

def save_failures(failures: dict):
    """Save failure tracking"""
    with open(FAILURES_FILE, "w") as f:
        json.dump(failures, f, indent=2)

def load_history():
    """Load historical data"""
    try:
        with open(HISTORY_FILE) as f:
            return json.load(f)
    except:
        return {"checks": []}

def save_history(history: dict):
    """Save historical data"""
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

def cleanup_old_history(history: dict, retention_days: int):
    """Remove old history entries"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    history["checks"] = [
        c for c in history.get("checks", [])
        if datetime.fromisoformat(c["timestamp"].replace("Z", "+00:00")) >= cutoff
    ]
    return history

def run_healthcheck():
    """Run full health check"""
    config = load_config()
    endpoints = config.get("endpoints", {})
    thresholds = config.get("thresholds", {})
    alert_config = config.get("alert", {})
    
    print(f"=== Test Environment Health Check === {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check all endpoints
    results = {}
    stats = {"ok": 0, "warning": 0, "critical": 0}
    
    for key, endpoint_config in endpoints.items():
        result = check_endpoint(endpoint_config.get("name", key), endpoint_config)
        results[key] = result
        stats[result["status"]] += 1
        
        # Print result
        icon = "✅" if result["status"] == "ok" else ("🔴" if result["status"] == "critical" else "⚠️ ")
        rt = f"{result['response_time_ms']}ms" if result['response_time_ms'] else "N/A"
        
        print(f"{icon} {result['name']}: {result['status_code']} ({rt})")
        if result.get("error"):
            print(f"   Error: {result['error']}")
    
    # Summary
    print()
    print(f"Summary: {stats['ok']} OK, {stats['warning']} WARNING, {stats['critical']} CRITICAL")
    
    # Check for consecutive failures
    if stats["critical"] > 0 and alert_config.get("enabled"):
        failures = load_failures()
        failures["consecutive_failures"] += 1
        failures["last_failure_time"] = datetime.now(timezone.utc).isoformat()
        
        threshold = thresholds.get("consecutive_failures_for_alert", 3)
        
        if failures["consecutive_failures"] >= threshold:
            print(f"🚨 CRITICAL: {failures['consecutive_failures']} consecutive failures detected!")
            print(f"   Last failure: {failures['last_failure_time']}")
            
            # Save alert to file for cron/main session to pick up
            alert_file = Path("/tmp/healthcheck_alert.json")
            alert_file.write_text(json.dumps({
                "level": "critical",
                "consecutive_failures": failures["consecutive_failures"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "endpoints": [r["name"] for r in results.values() if r["status"] == "critical"],
                "details": {k: v for k, v in results.items() if v["status"] == "critical"}
            }, indent=2))
            print(f"   Alert saved to {alert_file}")
        
        save_failures(failures)
    else:
        # Reset failure count on success
        if stats["critical"] == 0:
            save_failures({"consecutive_failures": 0, "last_failure_time": None})
    
    # Save to history
    history = load_history()
    history["checks"].append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "results": results,
        "stats": stats
    })
    
    # Cleanup old entries
    retention = thresholds.get("history_retention_days", 7)
    history = cleanup_old_history(history, retention)
    save_history(history)
    
    # Exit code based on critical failures
    sys.exit(1 if stats["critical"] > 0 else 0)

if __name__ == "__main__":
    run_healthcheck()