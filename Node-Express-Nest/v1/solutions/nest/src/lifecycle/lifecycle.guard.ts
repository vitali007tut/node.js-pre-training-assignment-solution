import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class LifecycleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const blockHeader = request.headers?.['x-block-access'];

    console.log(
      '[Lifecycle] Guard: checking access',
      `(x-block-access=${blockHeader ?? 'not set'})`,
    );

    if (blockHeader === 'true') {
      console.log('[Lifecycle] Guard: access blocked');
      throw new ForbiddenException('Access blocked by LifecycleGuard');
    }

    console.log('[Lifecycle] Guard: access allowed');
    return true;
  }
}
