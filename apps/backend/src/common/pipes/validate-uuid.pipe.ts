import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Custom UUID validation pipe that returns a cleaner 400 error
 * with {"error": "Invalid studentId format"} instead of NestJS default.
 */
@Injectable()
export class ValidateUuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!value || !uuidRegex.test(value)) {
      throw new BadRequestException({ error: 'Invalid studentId format' });
    }

    return value;
  }
}
