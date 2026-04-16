export function singleFlight(key_fn: (...args: any[]) => string) {
    const flights = new Map<string, Promise<any>>();

    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value!;

        descriptor.value = function(...args: any[]) {
            const key = key_fn(...args);

            if(flights.has(key)) {
                console.log(`Single flight hit for key ${key}`);
                return flights.get(key)!;
            }

            const promise = originalMethod.apply(this, args)
                .catch((err: any) => {
                    console.error(`Error in singleFlight for key ${key}:`, err);
                    throw err;
                })
                .finally(() => {
                    flights.delete(key);
                });

            flights.set(key, promise);

            return promise;
        }

        return descriptor;
    
    }
}