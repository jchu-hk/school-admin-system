#!/usr/bin/env tsx
/**
 * 自动生成版本信息脚本
 * 
 * 功能：
 * 1. 从 package.json 读取版本号
 * 2. 从 git log 萃取最近的变更记录
 * 3. 生成 public/version.json 供前端读取
 * 
 * 使用：
 * - npm run generate-version (构建前调用)
 * - 或在 Dockerfile 中作为构建步骤
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json')
const VERSION_OUTPUT = path.join(ROOT_DIR, 'public', 'version.json')

interface VersionInfo {
  version: string
  buildDate: string
  gitCommit: string
  gitBranch: string
  changelog: Array<{
    version: string
    date: string
    changes: string[]
  }>
}

function getGitInfo(): { commit: string; branch: string } {
  // 优先从环境变量读取 (Docker 构建时通过 --build-arg 传入)
  const envCommit = process.env.GIT_COMMIT
  const envBranch = process.env.GIT_BRANCH
  
  if (envCommit && envBranch && envCommit !== 'unknown') {
    return { commit: envCommit, branch: envBranch }
  }
  
  // Fallback: 从 git 命令读取 (本地开发时)
  try {
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
    return { commit, branch }
  } catch {
    return { commit: 'unknown', branch: 'unknown' }
  }
}

function getRecentCommits(limit: number = 20): Array<{ message: string; date: string }> {
  try {
    const log = execSync(
      `git log --pretty=format:"%s|%ci" -${limit}`,
      { encoding: 'utf-8' }
    ).trim()
    
    if (!log) return []
    
    return log.split('\n').map(line => {
      const [message, date] = line.split('|')
      return { message, date: date.split(' ')[0] }
    })
  } catch {
    return []
  }
}

function parseChangelogFromCommits(commits: Array<{ message: string; date: string }>): Array<{
  version: string
  date: string
  changes: string[]
}> {
  const changelog: Array<{ version: string; date: string; changes: string[] }> = []
  
  // 按日期分组 commits
  const byDate: Record<string, string[]> = {}
  
  for (const c of commits) {
    if (!byDate[c.date]) {
      byDate[c.date] = []
    }
    // 过滤掉纯技术性 commit (如 heartbeat, chore 等)
    if (!c.message.match(/^(heartbeat|pm:|chore:)/i)) {
      byDate[c.date].push(c.message)
    }
  }
  
  // 转换为 changelog 格式
  const dates = Object.keys(byDate).sort().reverse()
  
  for (const date of dates.slice(0, 10)) {
    const changes = byDate[date]
    if (changes.length > 0) {
      changelog.push({
        version: `build-${date}`,
        date,
        changes: changes.map(c => c.replace(/^[a-z]+: /i, ''))
      })
    }
  }
  
  return changelog
}

function main() {
  // 读取 package.json
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'))
  const version = packageJson.version || '1.0.0'
  
  // 获取 git 信息
  const gitInfo = getGitInfo()
  
  // 获取最近 commits
  const commits = getRecentCommits(30)
  
  // 解析 changelog
  const changelog = parseChangelogFromCommits(commits)
  
  // 生成版本信息
  const versionInfo: VersionInfo = {
    version: `v${version}`,
    buildDate: new Date().toISOString().split('T')[0],
    gitCommit: gitInfo.commit,
    gitBranch: gitInfo.branch,
    changelog
  }
  
  // 确保 public 目录存在
  const publicDir = path.dirname(VERSION_OUTPUT)
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  
  // 写入文件
  fs.writeFileSync(VERSION_OUTPUT, JSON.stringify(versionInfo, null, 2))
  
  console.log('✅ Version info generated:')
  console.log(`   Version: ${versionInfo.version}`)
  console.log(`   Build Date: ${versionInfo.buildDate}`)
  console.log(`   Git Commit: ${versionInfo.gitCommit}`)
  console.log(`   Git Branch: ${versionInfo.gitBranch}`)
  console.log(`   Changelog entries: ${versionInfo.changelog.length}`)
}

main()