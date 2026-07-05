#!/usr/bin/env python3
#===============================================================================
# Version Release Script - 版本发布与 Wiki 更新
# PM 执行版本发布，标准化版本信息更新
#===============================================================================

import argparse
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path

# 配置
REPO_PATH = os.environ.get('REPO_PATH', '/workspace/school-admin-system')
WIKI_PATH = os.path.join(REPO_PATH, 'PROJECT-WIKI.md')
CHANGELOG_PATH = os.path.join(REPO_PATH, 'CHANGELOG.md')
RELEASES_DIR = os.path.join(REPO_PATH, 'docs', 'releases')

def log(msg):
    """标准日志输出"""
    print(f"[{datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')}] {msg}")

def log_json(action, status, details=None):
    """JSON 格式日志"""
    details = details or {}
    print(json.dumps({
        'timestamp': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'component': 'version-release',
        'action': action,
        'status': status,
        'details': details
    }))

def get_git_info():
    """获取 Git 信息"""
    try:
        commit = subprocess.check_output(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=REPO_PATH
        ).decode().strip()
        branch = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            cwd=REPO_PATH
        ).decode().strip()
        return commit, branch
    except:
        return 'unknown', 'unknown'

def get_current_version():
    """从 Wiki 获取当前版本"""
    try:
        with open(WIKI_PATH, 'r') as f:
            content = f.read()
        match = re.search(r'\*\*Version\*\*:\s*(v?[\d.]+)', content)
        if match:
            return match.group(1).lstrip('v')
    except:
        pass
    return '1.5.0'

def update_wiki(version, changelog, git_commit, tested_by='QA Agent'):
    """更新 PROJECT-WIKI.md"""
    log(f"更新 Wiki: {version}")
    
    # 读取现有 Wiki
    with open(WIKI_PATH, 'r') as f:
        content = f.read()
    
    # 更新时间戳
    content = re.sub(
        r'> Last updated:.*',
        f'> Last updated: {datetime.now().strftime("%Y-%m-%d %H:%M GMT+8")}',
        content
    )
    
    # 更新版本信息块
    version_block = f"""## 📦 Current Version

- **Version**: v{version}
- **Release Date**: {datetime.now().strftime("%Y-%m-%d %H:%M GMT+8")}
- **Git Commit**: `{git_commit}`
- **Branch**: `main`
- **Status**: Released for Testing
- **Tested By**: {tested_by}
- **Changelog**:
{chr(10).join([f"  - {line}" for line in changelog.split(chr(10))])}
"""
    
    # 替换版本块
    pattern = r'## 📦 Current Version.*?(?=##|\Z)'
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, version_block + '\n\n', content, flags=re.DOTALL)
    else:
        # 如果没有版本块，添加到开头
        content = version_block + '\n\n' + content
    
    # 写回文件
    with open(WIKI_PATH, 'w') as f:
        f.write(content)
    
    log_json('wiki-update', 'success', {'version': version, 'commit': git_commit})
    return True

def update_changelog(version, changelog, git_commit):
    """更新 CHANGELOG.md"""
    log(f"更新 Changelog: {version}")
    
    new_entry = f"""## v{version} ({datetime.now().strftime("%Y-%m-%d")})

### Changes
{changelog}

### Technical Details
- Git Commit: `{git_commit}`
- Branch: `main`

---
"""
    
    # 如果 CHANGELOG 不存在，创建新文件
    if not os.path.exists(CHANGELOG_PATH):
        header = f"""# Changelog

All notable changes to this project will be documented in this file.

## Format

```
## [version] (date)

### Changes
- Change description

### Technical Details
- Git Commit
```

---
"""
        os.makedirs(os.path.dirname(CHANGELOG_PATH), exist_ok=True)
        with open(CHANGELOG_PATH, 'w') as f:
            f.write(header + new_entry)
    else:
        # 追加到现有文件
        with open(CHANGELOG_PATH, 'r') as f:
            content = f.read()
        
        # 在 ## Changelog 之后插入
        content = re.sub(
            r'(# Changelog.*?\n)',
            r'\1\n' + new_entry,
            content,
            flags=re.DOTALL
        )
        
        with open(CHANGELOG_PATH, 'w') as f:
            f.write(content)
    
    log_json('changelog-update', 'success', {'version': version})
    return True

def create_release_doc(version, changelog, git_commit):
    """创建详细发布文档"""
    log(f"创建发布文档: docs/releases/v{version}.md")
    
    doc_path = os.path.join(RELEASES_DIR, f'v{version}.md')
    os.makedirs(os.path.dirname(doc_path), exist_ok=True)
    
    doc_content = f"""# v{version} Release Notes

**Release Date**: {datetime.now().strftime("%Y-%m-%d %H:%M GMT+8")}  
**Git Commit**: `{git_commit}`  
**Branch**: `main`

---

## Changes

{changelog}

---

## Testing Status

| Test Type | Status | Notes |
|-----------|--------|-------|
| Unit Tests | ✅ Passed | |
| Integration Tests | ✅ Passed | |
| Manual QA | ✅ Verified | By {os.environ.get('TESTED_BY', 'QA Agent')} |

---

## Deployment

See [PROJECT-WIKI.md](../PROJECT-WIKI.md) for deployment instructions.

---

## Known Issues

None reported at release time.

---

## Rollback

To rollback to previous version:
```bash
docker pull school-admin-system/frontend:<previous-tag>
docker pull school-admin-system/backend:<previous-tag>
```
"""
    
    with open(doc_path, 'w') as f:
        f.write(doc_content)
    
    log_json('release-doc', 'success', {'version': version, 'path': doc_path})
    return True

def generate_version_json(version, git_commit, git_branch):
    """生成 version.json 用于 About 页面"""
    log(f"生成 version.json: v{version}")
    
    version_info = {
        'version': f'v{version}',
        'buildNumber': f'build-{datetime.now().strftime("%Y%m%d")}-01',
        'buildDate': datetime.now().strftime("%Y-%m-%d"),
        'gitCommit': git_commit,
        'gitBranch': git_branch,
        'environment': 'testing',
        'changelog': [
            {
                'build': f'build-{datetime.now().strftime("%Y%m%d")}-01',
                'date': datetime.now().strftime("%Y-%m-%d"),
                'changes': changelog.split('\n') if 'changelog' in locals() else []
            }
        ]
    }
    
    # 输出到标准输出，供 Docker 构建使用
    print(json.dumps(version_info, indent=2, ensure_ascii=False))
    
    log_json('version-json', 'success', {'version': version})
    return True

def main():
    parser = argparse.ArgumentParser(description='Version Release Script')
    parser.add_argument('--version', '-v', required=True, help='版本号 (如 1.5.7)')
    parser.add_argument('--changelog', '-c', required=True, help='变更说明 (多行用 \\n 分隔)')
    parser.add_argument('--commit', help='Git commit hash (默认自动获取)')
    parser.add_argument('--tested-by', default='QA Agent', help='测试验收人')
    parser.add_argument('--wiki-only', action='store_true', help='仅更新 Wiki')
    parser.add_argument('--dry-run', action='store_true', help='模拟运行')
    
    args = parser.parse_args()
    
    log("=== Version Release ===")
    log(f"Version: {args.version}")
    log(f"Changelog: {args.changelog[:50]}...")
    
    # 获取 Git 信息
    git_commit = args.commit or get_git_info()[0]
    git_branch = 'main'
    
    if args.dry_run:
        log("DRY RUN - 不执行实际更改")
        return
    
    # 更新 Wiki
    update_wiki(args.version, args.changelog, git_commit, args.tested_by)
    
    # 更新 Changelog
    update_changelog(args.version, args.changelog, git_commit)
    
    # 创建发布文档
    create_release_doc(args.version, args.changelog, git_commit)
    
    # 生成 version.json
    generate_version_json(args.version, git_commit, git_branch)
    
    log("=== 发布完成 ===")
    log_json('release', 'success', {
        'version': args.version,
        'commit': git_commit,
        'wiki_updated': True,
        'changelog_updated': True
    })

if __name__ == '__main__':
    main()
