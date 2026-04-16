import { performance } from "perf_hooks";
import logger from "./logger";

const meassure = (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value!;

    descriptor.value = async function(...args: any[]) {
        const start = performance.now();
        const result = await originalMethod.apply(this, args);
        const end = performance.now();

        logger(`${String(propertyKey)} took ${(end - start).toFixed(2)}ms to execute`, "PERF");

        return result;
    }

    return descriptor;
}

export default meassure;