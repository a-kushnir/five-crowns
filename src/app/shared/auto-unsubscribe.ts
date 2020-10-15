
export function AutoUnsubscribe(constructor) {
  const original = constructor.prototype.ngOnDestroy;

  constructor.prototype.ngOnDestroy = function(): void {
    Object.keys(this).map(key => {
      const property = this[key];
      if (property && (typeof property.unsubscribe === 'function')) {
        property.unsubscribe();
      }
    });
    if (original && typeof original === 'function') {
      original.apply(this, arguments);
    }
  };
}
