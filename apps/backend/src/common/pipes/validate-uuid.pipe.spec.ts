import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ValidateUuidPipe } from './validate-uuid.pipe';

describe('ValidateUuidPipe', () => {
  let pipe: ValidateUuidPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateUuidPipe],
    }).compile();

    pipe = module.get<ValidateUuidPipe>(ValidateUuidPipe);
  });

  describe('valid UUIDs', () => {
    const validUuids = [
      '123e4567-e89b-12d3-a456-426614174000',
      'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11',
      '00000000-0000-0000-0000-000000000000',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      '550e8400-e29b-41d4-a716-446655440000',
    ];

    it.each(validUuids)('should accept valid UUID: %s', (uuid) => {
      expect(pipe.transform(uuid)).toBe(uuid);
    });
  });

  describe('invalid UUIDs', () => {
    const invalidValues = [
      { value: 'not-a-uuid', description: 'plain string' },
      { value: '12345', description: 'short numeric string' },
      { value: '123e4567-e89b-12d3-a456', description: 'incomplete UUID' },
      { value: '123e4567-e89b-12d3-a456-42661417400g', description: 'UUID with invalid hex char' },
      { value: '', description: 'empty string' },
      { value: '123e4567e89b12d3a456426614174000', description: 'UUID without dashes' },
      { value: '123e4567-e89b-12d3-a456-42661417400', description: 'UUID with wrong length' },
      { value: 'student-123', description: 'student-like string' },
      { value: '123e4567-e89b-12d3-a456-42661417400x', description: 'trailing invalid char' },
    ];

    it.each(invalidValues)(
      'should reject invalid UUID: $description ($value)',
      ({ value }) => {
        expect(() => pipe.transform(value)).toThrow(BadRequestException);
        try {
          pipe.transform(value);
        } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect((e as BadRequestException).getResponse()).toEqual({
            error: 'Invalid studentId format',
          });
        }
      },
    );

    it('should throw BadRequestException with correct error response', () => {
      expect.assertions(2);
      try {
        pipe.transform('invalid-uuid');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect((e as BadRequestException).getResponse()).toEqual({
          error: 'Invalid studentId format',
        });
      }
    });
  });

  describe('null/undefined handling', () => {
    it('should reject null value', () => {
      expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
    });

    it('should reject undefined value', () => {
      expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
    });
  });
});
