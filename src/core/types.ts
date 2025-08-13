export type NullOrUndefinedOr<T> = T extends void ? never : null | undefined | T;

export interface LatLngArray extends Array<number> {
    length: 2;

    0: number;
    1: number;

}
