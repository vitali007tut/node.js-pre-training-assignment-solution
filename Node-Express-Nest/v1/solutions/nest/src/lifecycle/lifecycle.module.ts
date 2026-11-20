import { Module } from '@nestjs/common';
import { LifecycleController } from './lifecycle.controller';
import { LifecycleGuard } from './lifecycle.guard';
import { LifecycleInterceptor } from './lifecycle.interceptor';
import { LifecyclePipe } from './lifecycle.pipe';

@Module({
  controllers: [LifecycleController],
  providers: [LifecycleGuard, LifecyclePipe, LifecycleInterceptor],
})
export class LifecycleModule {}
