/**
 * test/intake.smoke.ts —— 冒烟自测（F-SRE-014 AC-014a/014b / UC-SRE-016）
 *
 * 运行：cd apps/ai-sre-service && npx ts-node test/intake.smoke.ts
 * 覆盖（对齐 AC/UC）：
 *  1. 归一化缺关键字段 → missing（异常流, UC-SRE-016「提示补全重试」）
 *  2. 合法报文归一化 → reporter_contact 脱敏、raw 落库/空、source/severity、source='intake'
 *  3. triage：重复(dup)→不新建；已知(known,同 open issue)→并入；无匹配=新建(new)
 *  4. Issue 关联（本地伪号 no-op gateway）
 *  5. 回执闭环 received→…→closed；首投失败会重试（ack_attempts≥2）
 *  6. NFR-S 保留：raw 超时清空；关单后 contact 清除
 *  7. 空 intake_channels = 待接入态（routes 空、不注册）；有通道则注册 POST 路由
 */

import * as assert from 'assert';
import { IntakeService } from '../src/intake/ingestion';
import { normalizeReport } from '../src/intake/normalize';
import { IncidentStore } from '../src/incidents/incident-store';
import { RetentionSweeper, RetentionPolicy } from '../src/intake/retention';
import { LogAckBackend } from '../src/intake/acknowledger';
import { planIntakeRoutes } from '../src/intake/http-intake';

let pass = 0;
function t(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}
async function ta(name: string, fn: () => Promise<void>) {
  await fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log('== 1. normalize 关键字段校验 ==');
  const normMissing = normalizeReport(
    { system_id: '', symptom_desc: '' },
    { sourceChannel: 'test', receivedAt: new Date() },
  );
  t('缺字段 → ok=false，missing 含 4 个关键字段', () => {
    assert.strictEqual(normMissing.ok, false);
    for (const f of ['system_id', 'symptom_desc', 'reported_at', 'reporter_contact']) {
      assert.ok(normMissing.missing.includes(f), `missing ${f}`);
    }
  });

  const ok = normalizeReport(
    {
      system_id: 'school-admin-system',
      symptom_desc: '用户列表页打开后一直转圈不显示数据，刷新无效',
      reported_severity: '高/多用户',
      reported_at: 1693000000,
      reporter_contact: 'ops-runner@corp.example.com',
      keep_raw: true,
    },
    { sourceChannel: 'sas_ops', receivedAt: new Date('2026-09-05T00:00:00Z') },
  );
  t('合法报文归一化成功', () => assert.ok(ok.ok && !!ok.incident));
  t('reporter_contact 脱敏入库（非明文全量）', () => {
    const ref = ok.incident!.reporter_contact_ref;
    assert.ok(ref && !ref.includes('ops-runner@corp.example.com'), `ref=${ref}`);
    assert.ok(ref.includes('***'), `ref=${ref}`);
  });
  t('keep_raw=true 时 raw 落库并剔除全量回执值', () => {
    const rp = ok.incident!.raw_payload as Record<string, unknown> | null;
    assert.ok(rp);
    assert.strictEqual(rp!['reporter_contact'], undefined);
  });
  t('source=intake + source_channel 保留', () => {
    assert.strictEqual(ok.incident!.source, 'intake');
    assert.strictEqual(ok.incident!.source_channel, 'sas_ops');
  });

  console.log('== 2. triage 三分类 ==');
  const store = new IncidentStore();
  const backend = new LogAckBackend();
  const svc = new IntakeService(store, { ackBackend: backend });
  const iso = new Date().toISOString();
  const r1 = await svc.ingest(
    { system_id: 'sas', symptom_desc: '导出报表报错，按钮点不动', reported_at: iso, reporter_contact: 'a@x.com' },
    { sourceChannel: 'webform', receivedAt: new Date() },
  );
  t('new: 首个同象 → triage=new、回执受理(received)', () => {
    assert.strictEqual(r1.triage!.triage, 'new');
    assert.strictEqual(r1.acked, true);
    assert.strictEqual(r1.incident!.ack_status, 'received');
  });
  const r2 = await svc.ingest(
    { system_id: 'sas', symptom_desc: '导出报表报错，按钮点不动', reported_at: iso, reporter_contact: 'b@x.com' },
    { sourceChannel: 'im', receivedAt: new Date() },
  );
  t('dup: 同系统同象重复 → triage=dup，并入既有，不新建 Issue', () => {
    assert.strictEqual(r2.triage!.triage, 'dup');
    assert.ok(r2.triage!.duplicate_of_id);
    assert.strictEqual(r2.issueId, r1.issueId);
  });
  const r3 = await svc.ingest(
    { system_id: 'sas', symptom_desc: '完全不同现象 XZ99 报障', reported_at: iso, reporter_contact: 'c@x.com' },
    { sourceChannel: 'im', receivedAt: new Date() },
  );
  t('new(另一现象): 判定 new', () => {
    assert.strictEqual(r3.triage!.triage, 'new');
  });

  // known：模拟一张已存在 open Issue 关联的另一条 open 报障，再次同 issue 报文 → known（并入不新建）
  const storeK = new IncidentStore();
  const knownSvc = new IntakeService(storeK, { ackBackend: new LogAckBackend() });
  const kb = await knownSvc.ingest(
    { system_id: 'sas', symptom_desc: '登录页白屏', reported_at: iso, reporter_contact: 'd@x.com' },
    { sourceChannel: 'im', receivedAt: new Date() },
  );
  (storeK as { markIssue: Function }).markIssue(kb.incident!.incident_id, 555);
  // known：报障者在 Issue #555（已开）上补充同类但措辞不同信息 → 判定 known、并入不新建
  const rKnown = await knownSvc.ingest(
    { system_id: 'sas', symptom_desc: '多了一个更详细的根因线索：网关偶发超时导致白屏', issue_id: 555, reported_at: iso, reporter_contact: 'e@x.com' },
    { sourceChannel: 'ticket', receivedAt: new Date() },
  );
  await ta('known: 命中 open Issue #555 关联记录 → triage=known，并入不新建', async () => {
    assert.strictEqual(rKnown.triage!.triage, 'known');
    assert.strictEqual(rKnown.triage!.known_issue_id, 555);
    assert.strictEqual(rKnown.incident!.duplicate_of_id, null); // post-known 未并入 id
    assert.ok(rKnown.issueId === 555);
  });

  console.log('== 3. 回执闭环与重试 ==');
  const id3 = r1.incident!.incident_id;
  backend.failNextOnce = true;
  const okClosed = await svc.ack().acknowledge(id3, 'closed', '已修复并验证');
  t('回执失败→重试后成功，acked=true，attempts≥2，status=closed', () => {
    const inc = store.getById(id3)!;
    assert.strictEqual(okClosed, true);
    assert.ok(inc.ack_attempts >= 2, `attempts=${inc.ack_attempts}`);
    assert.strictEqual(inc.ack_status, 'closed');
  });

  console.log('== 4. NFR-S 保留清理 ==');
  const storeR = new IncidentStore();
  const old = new Date(Date.now() - 31 * 864e5);
  const ri = await new IntakeService(storeR).ingest(
    { system_id: 'sas', symptom_desc: 'trx-leak', reported_at: old.toISOString(), reporter_contact: 'old@x.com', keep_raw: true },
    { sourceChannel: 'webform', receivedAt: old },
  );
  const si = ri.incident!;
  si.ack_status = 'closed';
  si.resolved_at = new Date(Date.now() - 10 * 864e5).toISOString(); // 10 天前关单
  const policy: RetentionPolicy = { rawPayloadKeepDays: 30, contactKeepDaysAfterClose: 7 };
  const sweep = new RetentionSweeper(storeR, policy, () => new Date());
  const rep = sweep.runOnce();
  t('raw_payload 超 30 天自动清空', () => {
    assert.ok(rep.clearedRaw >= 1);
    assert.strictEqual(si.raw_payload, null);
  });
  t('关单后 >7 天 reporter_contact_ref 清除（保留审计字段）', () => {
    assert.ok(rep.clearedContact >= 1);
    assert.strictEqual(si.reporter_contact_ref, '');
  });

  console.log('== 5. 空配置 = 待接入态（AC 空态基线）==');
  const mk = (channels?: unknown[]) => ({ identity: { instance_id: 't', listen: '0.0.0.0:0' }, systems: [], intake_channels: channels } as any);
  const emptyRoutes = planIntakeRoutes(mk([]));
  t('intake_channels=[] → 无路由（不注册不报错）', () => assert.deepStrictEqual(emptyRoutes, []));
  const oneRoutes = planIntakeRoutes(mk([{ type: 'webhook', name: 'ops', verb: 'POST', enabled: true }]));
  t('启用 1 webhook → 注册 1 条 POST 收报路由', () => {
    assert.strictEqual(oneRoutes.length, 1);
    assert.strictEqual(oneRoutes[0].method, 'POST');
    assert.ok(oneRoutes[0].path.endsWith('/ops'));
  });

  console.log(`\n✅ F-SRE-014 intake 冒烟自测全部通过 (${pass})`);
}

main().catch((e) => {
  console.error('✗ F-SRE-014 intake 冒烟自测失败:', e);
  process.exit(1);
});
