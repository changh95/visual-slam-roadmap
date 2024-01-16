const Predicate = () => boolean
export function and(...fs: (Predicate | boolean)[]): (...args: any[]) => boolean
export function or(...fs: (Predicate | boolean)[]): (...args: any[]) => boolean
