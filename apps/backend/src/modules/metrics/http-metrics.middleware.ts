import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Histogram, Counter } from 'prom-client';
import { MetricsController } from './metrics.controller';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  private static readonly logger = new Logger(HttpMetricsMiddleware.name);
  private static initialized = false;

  private static httpRequestDuration: Histogram<string>;
  private static httpRequestsTotal: Counter<string>;

  private static init() {
    if (HttpMetricsMiddleware.initialized) {
      return;
    }

    const registry = MetricsController.getRegistry();

    // Remove existing metrics if they were already registered (e.g., during hot-reload)
    const existingHistogram = registry.getSingleMetric(
      'http_request_duration_seconds',
    );
    if (existingHistogram) {
      registry.removeSingleMetric('http_request_duration_seconds');
    }
    const existingTotal = registry.getSingleMetric('http_requests_total');
    if (existingTotal) {
      registry.removeSingleMetric('http_requests_total');
    }

    HttpMetricsMiddleware.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
      registers: [registry],
    });

    HttpMetricsMiddleware.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [registry],
    });

    HttpMetricsMiddleware.initialized = true;
    HttpMetricsMiddleware.logger.log('HTTP metrics registered');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    HttpMetricsMiddleware.init();

    const startTime = process.hrtime.bigint();

    // Normalize route: replace UUIDs and numbers with :param placeholders
    const normalizedRoute = normalizeRoute(req.path, req.route?.path);

    // Listen for response finish event
    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;
      const status = res.statusCode.toString();
      const method = req.method;

      HttpMetricsMiddleware.httpRequestDuration.observe(
        { method, route: normalizedRoute, status },
        durationSeconds,
      );
      HttpMetricsMiddleware.httpRequestsTotal.inc(
        { method, route: normalizedRoute, status },
        1,
      );
    });

    next();
  }
}

/**
 * Normalize the request path to a route pattern.
 * Uses the Express route path if available (from matched routes),
 * otherwise falls back to a simple normalization of the URL path.
 */
function normalizeRoute(path: string, routePath?: string): string {
  if (routePath) {
    return routePath;
  }

  // Fallback: replace UUID-like segments and numeric IDs with :param
  return path
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:uuid',
    )
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[A-Za-z0-9]{20,}/g, '/:token');
}
