export function stub<T>(
  returnType: NonNullable<T>,
  promise: false,
  ...params: any
): NonNullable<T>;

export function stub<T>(
  returnType: NonNullable<T>,
  promise: true,
  ...params: any
): Promise<NonNullable<T>>;

export function stub(
  returnType: null | undefined,
  promise: false,
  ...params: any
): void;

export function stub(
  returnType: null | undefined,
  promise: true,
  ...params: any
): Promise<void>;

export function stub<T>(
  returnType: T,
  promise: boolean,
  ...params: any
): NonNullable<T> | Promise<NonNullable<T>> | void | Promise<void> {
  console.error(`This should not be called. Params: ${[...params]}`);

  if (promise) {
    if (returnType == null) {
      return new Promise<void>((resolve) => resolve());
    }

    return new Promise<NonNullable<T>>((resolve) => {
      resolve(returnType);
    });
  }

  if (returnType != null) {
    return returnType;
  }
}
