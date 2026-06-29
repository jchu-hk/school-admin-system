import { UpdateUserDto } from './update-user.dto';
import { UserStatus } from '../user.entity';

describe('UpdateUserDto', () => {
  it('should inherit phone field from CreateUserDto', () => {
    const dto = new UpdateUserDto();
    dto.phone = '85291234567';

    expect(dto.phone).toBe('85291234567');
  });

  it('should allow partial updates with phone only', () => {
    const dto = new UpdateUserDto();
    dto.phone = '85298765432';

    expect(dto).toHaveProperty('phone');
    expect(dto.phone).toBe('85298765432');
  });

  it('should be assignable from CreateUserDto fields', () => {
    // PartialType inherits all fields as optional
    const dto = new UpdateUserDto();
    dto.username = 'test';
    dto.phone = '85291234567';
    dto.email = 'test@example.com';

    // Should accept these fields
    expect(dto.username).toBe('test');
    expect(dto.phone).toBe('85291234567');
    expect(dto.email).toBe('test@example.com');
  });

  it('should support status updates', () => {
    const dto = new UpdateUserDto();
    dto.status = UserStatus.DISABLED;

    expect(dto.status).toBe(UserStatus.DISABLED);
  });

  it('should allow all fields to be optional', () => {
    const dto = new UpdateUserDto();
    // All fields should be optional (undefined allowed)

    expect(dto.username).toBeUndefined();
    expect(dto.phone).toBeUndefined();
    expect(dto.email).toBeUndefined();
    expect(dto.password).toBeUndefined();
  });
});
