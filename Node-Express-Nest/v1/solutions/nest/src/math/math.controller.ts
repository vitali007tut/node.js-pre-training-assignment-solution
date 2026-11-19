import { Controller, Get, Query, ParseFloatPipe } from '@nestjs/common';
import { MathService } from './math.service';
import { LoggerService } from '../logger/logger.service';

type MathOperation = 'add' | 'subtract' | 'multiply' | 'divide';
type MathCalculation = (a: number, b: number) => number;

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
    return this.execute('add', a, b, (left, right) =>
      this.mathService.add(left, right),
    );
  }

  @Get('subtract')
  subtract(
    @Query('a', ParseFloatPipe) a: number,
    @Query('b', ParseFloatPipe) b: number,
  ) {
    return this.execute('subtract', a, b, (left, right) =>
      this.mathService.subtract(left, right),
    );
  }

  @Get('multiply')
  multiply(
    @Query('a', ParseFloatPipe) a: number,
    @Query('b', ParseFloatPipe) b: number,
  ) {
    return this.execute('multiply', a, b, (left, right) =>
      this.mathService.multiply(left, right),
    );
  }

  @Get('divide')
  divide(
    @Query('a', ParseFloatPipe) a: number,
    @Query('b', ParseFloatPipe) b: number,
  ) {
    return this.execute('divide', a, b, (left, right) =>
      this.mathService.divide(left, right),
    );
  }

  private execute(
    operation: MathOperation,
    a: number,
    b: number,
    calculate: MathCalculation,
  ) {
    this.logger.log('MathController', `Incoming: ${operation}?a=${a}&b=${b}`);
    return { operation, a, b, result: calculate(a, b) };
  }
}
