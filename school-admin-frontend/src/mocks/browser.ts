import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// 配置 MSW worker
export const worker = setupWorker(...handlers);
