import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    const mockResult = { status: 'ok', timestamp: '2024-01-01T00:00:00.000Z' };
    jest.spyOn(service, 'getHealthStatus').mockReturnValue(mockResult);

    expect(controller.getHealth()).toBe(mockResult);
    expect(service.getHealthStatus).toHaveBeenCalled();
  });
});
