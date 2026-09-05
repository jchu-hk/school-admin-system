/**
 * incidents/fingerprint.ts
 *
 * 报障去重指纹生成（F-SRE-007 去重/抑制 + F-SRE-014 triage 三分类共用）。
 *
 * 归一化稳定输入（system_id + 归一化现象 token + 分类后严重度归一），
 * 敲定含 system_id 的稳定 hash，供既有去重抑制链路与 intake triage
 * 做「同根因/同现象」判定。
 *
 * 指纹非用于 PII 识别——输入均为归一化现象文本，无联系人信息。
 */

import * as crypto from 'crypto';

/**
 * 对现象自由文本做轻度归一（小写 + 稳定 token 集合）。
 * 归并空格、标点分隔，排序去顶（避免「顺序不同」导致指纹不同）。
 */
export function normalizeSymptomTokens(symptom: string): string[] {
  const tokens = (symptom || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, ' ') // 仅保留字/数/下划线/连字符，去除标点
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return Array.from(new Set(tokens)).sort();
}

/**
 * 由 system_id + 现象描述敲定稳定去重指纹（SHA-256 前 64 hex）。
 * extraKeys 可纳入组件/根因弱信号（可选）。
 */
export function dedupFingerprint(
  systemId: string,
  symptomDesc: string,
  extraKeys: string[] = [],
): string {
  const tokens = normalizeSymptomTokens(symptomDesc);
  const canonical = [systemId.trim().toLowerCase(), ...tokens, ...extraKeys.map((k) => k.trim().toLowerCase())]
    .filter((s) => s.length > 0)
    .join('|');
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 64);
}
