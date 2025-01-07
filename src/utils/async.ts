export interface Deferred<T> extends Promise<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export const deferred = <T>() => {
  type DeferredResolve = (value: T | PromiseLike<T>) => void | undefined;
  type DeferredReject = (reason?: any) => void | undefined;

  let _resolve: DeferredResolve = undefined as unknown as DeferredResolve;
  let _reject: DeferredReject = undefined as unknown as DeferredReject;

  const promise = new Promise<T>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  }) as Deferred<T>;

  promise.resolve = _resolve;
  promise.reject = _reject;

  return promise;
};
