import { NullOrUndefinedOr } from './types';

export function checkForLatLngMistakes (value: NullOrUndefinedOr<number>): number {
	// Check haven't tried to treat L.latLng as array or array as L.latLng
	if (value === undefined) {
		throw ({ value });
	}

	return value as number;
}
