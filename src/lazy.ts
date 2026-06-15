export class Lazy<T> {
  private _value: T | undefined = undefined;

  constructor(private readonly compute: () => T) {}

  get(): T {
    if (this._value === undefined) this._value = this.compute();
    return this._value;
  }
}
