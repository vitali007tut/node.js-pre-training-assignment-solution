import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { MathService } from './math.service';
import { MathController } from './math.controller';

@Module({
  imports: [LoggerModule],
  controllers: [MathController],
  providers: [MathService],
})
export class MathModule {}
