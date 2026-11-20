import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class LifecyclePipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    console.log(
      `[Lifecycle] Pipe: transforming ${metadata.data}=${value} (${metadata.type})`,
    );

    if (!/^[-]?\d+$/.test(value)) {
      throw new BadRequestException(
        `Value "${value}" for "${metadata.data}" must be an integer`,
      );
    }

    const transformed = Number(value);
    console.log(`[Lifecycle] Pipe: transformed to ${transformed}`);
    return transformed;
  }
}
