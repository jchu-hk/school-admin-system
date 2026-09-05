/**
 * main.ts
 *
 * ai-sre-service 引导入口（M1 骨架）。
 *
 * 职责：
 *   1. 从 env（SRE_CONFIG_PATH）或默认 config/default.yaml 加载配置
 *   2. 启动一个最小 HTTP 服务，暴露 GET /health 健康端点
 *   3. 打印「待接入/已接入」状态，并列出已纳管系统采用的适配器
 *
 * 本骨架不承载采集/检测/自愈等核心逻辑（M2+ 交付），
 * 仅验证「配置与代码分离 + 系统无关启动」这一 M1 目标。
 */

import * as http from 'http';
import { loadConfig, resolveConfigPath } from './config/loader';
import { SreConfig, isOnboarding } from './config/types';
import { createAdapter, registeredAdapterTypes } from './adapters';

/** 构建一个极简 HTTP 处理器（仅 /health + / 概览） */
function buildHandler(config: SreConfig): http.RequestListener {
  return (req, res) => {
    const url = (req.url ?? '/').split('?')[0];
    if (url === '/health') {
      const body = {
        status: 'ok',
        service: 'ai-sre-service',
        instance_id: config.identity.instance_id,
        onboarding: isOnboarding(config),
        systems: config.systems.map((s) => ({
          system_id: s.system_id,
          adapter: s.adapter,
        })),
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body, null, 2));
      return;
    }
    if (url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(
        `ai-sre-service (${config.identity.instance_id})\n` +
          `状态: ${isOnboarding(config) ? '待接入(onboarding)' : '已接入'}\n` +
          `已注册适配器: ${registeredAdapterTypes().join(', ')}\n`,
      );
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  };
}

async function bootstrap(): Promise<void> {
  const configPath = resolveConfigPath();
  console.log(`[ai-sre-service] 加载配置: ${configPath}`);

  const config: SreConfig = loadConfig(configPath);
  console.log(`[ai-sre-service] 实例: ${config.identity.instance_id}`);
  console.log(`[ai-sre-service] 已注册适配器类型: ${registeredAdapterTypes().join(', ')}`);

  if (isOnboarding(config)) {
    console.log('[ai-sre-service] 状态: 待接入（systems 为空）');
  } else {
    console.log(`[ai-sre-service] 状态: 已接入 ${config.systems.length} 个系统`);
    for (const s of config.systems) {
      const adapter = createAdapter(s.adapter, s.system_id, s);
      console.log(
        `  - system_id=${s.system_id} adapter=${s.adapter} capabilities=[${adapter
          .capabilities()
          .join(', ')}]`,
      );
    }
  }

  const [host, portStr] = parseListen(config.identity.listen);
  const port = Number(portStr);

  const server = http.createServer(buildHandler(config));
  server.listen(port, host, () => {
    console.log(`[ai-sre-service] 监听 http://${host}:${port} (GET /health)`);
  });
}

/** 解析 "host:port" 监听地址 */
function parseListen(listen: string): [string, string] {
  const idx = listen.lastIndexOf(':');
  if (idx < 0) return ['0.0.0.0', listen];
  const host = listen.slice(0, idx);
  const port = listen.slice(idx + 1);
  return [host || '0.0.0.0', port];
}

bootstrap().catch((err) => {
  console.error('[ai-sre-service] 启动失败:', err);
  process.exit(1);
});
