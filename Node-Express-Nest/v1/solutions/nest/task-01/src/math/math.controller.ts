import { Controller, Get, Query, ParseFloatPipe } from '@nestjs/common';
import { MathService } from './math.service';
import { LoggerService } from '../logger/logger.service';

@Controller('math')
export class MathController {
  constructor(
    private readonly mathService: MathService,
    private readonly logger: LoggerService,
  ) {}

  @Get('add')
  add(
    @Query('a', ParseFloatPipe) a: number,
    @Query('b', ParseFloatPipe) b: number,
  ) {
    this.logger.log('MathController', `Incoming: add?a=${a}&b=${b}`);
    return { operation: 'add', a, b, result: this.mathService.add(a, b) };
  }

  @Get('subtract')
  subtract(
    @Query('a', ParseFloatPipe) a: number,
    @Query('b', ParseFloatPipe) b: number,
  ) {
    this.logger.log('MathController', `Incoming: subtract?a=${a}&b=${b}`);
    return { operation: 'subtract', a, b, result: this.mathService.subtract(a, b) };
  }

  @Get('multiply')
  multiply(
    @Query('a', ParseFloatPipe) a: number,
    @Query('b', ParseFloatPipe) b: number,
  ) {
    this.logger.log('MathController', `Incoming: multiply?a=${a}&b=${b}`);
    return { operation: 'multiply', a, b, result: this.mathService.multiply(a, b) };
  }

  @Get('divide')
  divide(
    @Query('a', ParseFloatPipe) a: number,
    @Query('b', ParseFloatPipe) b: number,
  ) {
    this.logger.log('MathController', `Incoming: divide?a=${a}&b=${b}`);
    return { operation: 'divide', a, b, result: this.mathService.divide(a, b) };
  }
}
