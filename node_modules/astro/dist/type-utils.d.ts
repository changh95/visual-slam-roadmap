export type Simplify<T> = {
    [KeyType in keyof T]: T[KeyType];
} & {};
export type WithRequired<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};
export type OmitIndexSignature<ObjectType> = {
    [KeyType in keyof ObjectType as {} extends Record<KeyType, unknown> ? never : KeyType]: ObjectType[KeyType];
};
export type Kebab<T extends string, A extends string = ''> = T extends `${infer F}${infer R}` ? Kebab<R, `${A}${F extends Lowercase<F> ? '' : '-'}${Lowercase<F>}`> : A;
export type KebabKeys<T> = {
    [K in keyof T as K extends string ? Kebab<K> : K]: T[K];
};
export type ValueOf<T> = T[keyof T];
export type MapValue<T> = T extends Map<any, infer V> ? V : never;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends object | undefined ? DeepPartial<T[P]> : T[P];
};
