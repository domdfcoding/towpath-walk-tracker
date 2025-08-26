export type NullOrUndefinedOr<T> = T extends void ? never : null | undefined | T;
