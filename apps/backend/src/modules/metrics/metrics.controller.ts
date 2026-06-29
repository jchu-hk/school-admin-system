import { Controller, Get, Res, Logger, OnModuleInit } from '@nestjs/common';
import { Response } from 'express';
import { Registry, collectDefaultMetrics } from 'prom-client';

@Controller('metrics')
export class MetricsController implements OnModuleInit {
  private static readonly registry: Registry = new Registry();
  private static readonly logger = new Logger(MetricsController.name);
  private static initialized = false;

  static getRegistry(): Registry {
    return MetricsController.registry;
  }

  onModuleInit() {
    if (!MetricsController.initialized) {
      collectDefaultMetrics({ register: MetricsController.registry });
      MetricsController.initialized = true;
      MetricsController.logger.log('Default metrics registered');
    }
  }

  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    try {
      const registry = MetricsController.getRegistry();
      res.set('Content-Type', registry.contentType);
      res.end(await registry.metrics());
    } catch (error) {
      MetricsController.logger.error(
        `Metrics error: ${error.message}`,
        error.stack,
      );
      res.status(500).json({ error: error.message });
    }
  }
}
