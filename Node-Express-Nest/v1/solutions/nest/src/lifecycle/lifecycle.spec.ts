import {
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { of } from 'rxjs';
import { LifecycleGuard } from './lifecycle.guard';
import { LifecycleInterceptor } from './lifecycle.interceptor';
import { LifecyclePipe } from './lifecycle.pipe';

describe('Lifecycle components', () => {
  it('LifecyclePipe converts a string id to a number', () => {
    expect(
      new LifecyclePipe().transform('42', {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).toBe(42);
  });

  it('LifecyclePipe rejects a non-integer id', () => {
    expect(() =>
      new LifecyclePipe().transform('abc', {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).toThrow(BadRequestException);
  });

  it('LifecycleGuard allows access by default', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    expect(new LifecycleGuard().canActivate(context)).toBe(true);
  });

  it('LifecycleGuard blocks access with x-block-access=true', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-block-access': 'true' },
        }),
      }),
    } as ExecutionContext;

    expect(() => new LifecycleGuard().canActivate(context)).toThrow(
      ForbiddenException,
    );
  });

  it('LifecycleInterceptor calls the next handler', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/lifecycle/42' }),
      }),
    } as ExecutionContext;
    const next = { handle: () => of({ id: 42 }) };

    new LifecycleInterceptor()
      .intercept(context, next)
      .subscribe((value: unknown) => {
        expect(value).toEqual({ id: 42 });
        done();
      });
  });
});
