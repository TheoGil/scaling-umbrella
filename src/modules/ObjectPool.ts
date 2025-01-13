/**
 * Very rudimentary object pooling utility class. Usage :
 *
 * ```
 * // Create instance
 * const pool = new ObjectPool({
 *  onBeforeRecycle?: () => void // Optional callback
 * })
 *
 * // Fill pool using push method
 * while (fillPool) {
 *  pool.push(new Object())
 * }
 *
 * // Get object instance using fetch method. Returns null if no object is available.
 * const object = pool.fetch()
 *
 * // Once object is not needed anymore, recycle it to add it back to the pool.
 * This will trigger the onBeforeRecycle callback if one has been specified.
 * pool.recycle(object)
 * ```
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private onBeforeRecycle: ((object: T) => void) | undefined = undefined;

  constructor(params?: {
    onBeforeRecycle?: ((object: T) => void) | undefined;
  }) {
    if (params?.onBeforeRecycle)
      this.onBeforeRecycle = params.onBeforeRecycle.bind(this);
  }

  push(entry: T): void {
    this.pool.push(entry);
  }

  fetch(): T | undefined {
    if (this.length <= 0) {
      return undefined;
    }

    return this.pool.shift();
  }

  recycle(entry: T): void {
    this.onBeforeRecycle?.(entry);
    this.push(entry);
  }

  get length() {
    return this.pool.length;
  }
}
