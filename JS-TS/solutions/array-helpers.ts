/* eslint-disable @typescript-eslint/no-unused-vars */
// Task 02: Mini functional–utility library
// All helpers are declared but not implemented.

export function mapArray<T, R>(source: readonly T[], mapper: (item: T, index: number) => R): R[] {
  if (source === null || source === undefined) {
    throw new TypeError('source must not be null or undefined');
  }

  const result: R[] = [];
  const length = source.length;
  for (let i = 0; i < length; i++) {
    result.push(mapper(source[i], i));
  }
  return result;
}

export function filterArray<T>(source: readonly T[], predicate: (item: T, index: number) => boolean): T[] {
  if (source === null || source === undefined) {
    throw new TypeError('source must not be null or undefined');
  }

  const result: T[] = [];
  const length = source.length;
  for (let i = 0; i < length; i++) {
    if (predicate(source[i], i)) {
      result.push(source[i]);
    }
  }
  return result;
}

export function reduceArray<T, R>(source: readonly T[], reducer: (acc: R, item: T, index: number) => R, initial: R): R {
  if (source === null || source === undefined) {
    throw new TypeError('source must not be null or undefined');
  }

  let acc = initial;
  const length = source.length;
  for (let i = 0; i < length; i++) {
    acc = reducer(acc, source[i], i);
  }
  return acc;
}

export function partition<T>(source: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
  if (source === null || source === undefined) {
    throw new TypeError('source must not be null or undefined');
  }

  const pass: T[] = [];
  const fail: T[] = [];
  const length = source.length;
  for (let i = 0; i < length; i++) {
    const item = source[i];
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  return [pass, fail];
}

export function groupBy<T, K extends PropertyKey>(source: readonly T[], keySelector: (item: T) => K): Record<K, T[]> {
  if (source === null || source === undefined) {
    throw new TypeError('source must not be null or undefined');
  }

  const acc = {} as Record<K, T[]>;
  const length = source.length;
  for (let i = 0; i < length; i++) {
    const item = source[i];
    const key = keySelector(item);
    if (!Object.prototype.hasOwnProperty.call(acc, key)) {
      acc[key] = [];
    }
    acc[key].push(item);
  }
  return acc;
}
