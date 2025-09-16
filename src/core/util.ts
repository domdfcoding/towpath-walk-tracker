import { NullOrUndefinedOr } from './types';

export function checkForLatLngMistakes (value: NullOrUndefinedOr<number>): number {
	// Check haven't tried to treat L.latLng as array or array as L.latLng
	if (value === undefined) {
		throw ({ value });
	}

	return value as number;
}

export function updateQueryStringParam (key: string, value: number|string): void {
	const url = new URL(window.location.href);
	url.searchParams.set(key, value.toString()); // Add or update the parameter
	// window.history.pushState({}, null, url);
	window.history.replaceState({}, '', url);
}
