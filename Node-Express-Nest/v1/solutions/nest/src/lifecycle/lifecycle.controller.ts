import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { LifecycleGuard } from './lifecycle.guard';
import { LifecycleInterceptor } from './lifecycle.interceptor';
import { LifecyclePipe } from './lifecycle.pipe';

@Controller('lifecycle')
export class LifecycleController {
  @Get(':id')
  @UseGuards(LifecycleGuard)
  @UsePipes(LifecyclePipe)
  @UseInterceptors(LifecycleInterceptor)
  explore(@Param('id') id: number) {
    console.log('[Lifecycle] Controller: handler is running');
    return {
      id,
      message: 'Lifecycle components completed successfully',
    };
  }
}
