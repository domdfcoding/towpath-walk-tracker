function updateQueryStringParam (key: string, value: number): void {
	const url = new URL(window.location.href);
	url.searchParams.set(key, value.toString()); // Add or update the parameter
	// window.history.pushState({}, null, url);
	window.history.replaceState({}, '', url);
}

export function setupZoomState (map: L.Map): void {
	map.on('zoomend', function () {
		const zoomLvl: number = map.getZoom();
		updateQueryStringParam('zoom', zoomLvl);
	});

	map.on('moveend', function () {
		const centre = map.getCenter();
		updateQueryStringParam('lat', centre.lat);
		updateQueryStringParam('lng', centre.lng);
	});
}

interface IZoomState {
	centre: L.LatLng;
	zoomLvl: number;
 }

export function zoomStateFromURL (defaultZoom: number, defaultCentre: L.LatLng): IZoomState {
	const url = new URL(window.location.href);

	// let zoomLvl = map.getZoom();
	let zoomLvl = defaultZoom;
	if (url.searchParams.has('zoom')) {
		zoomLvl = parseInt(url.searchParams.get('zoom'));
	}

	// const centre = map.getCenter();
	const centre = defaultCentre;
	if (url.searchParams.has('lat')) {
		centre.lat = parseFloat(url.searchParams.get('lat'));
	}
	if (url.searchParams.has('lng')) {
		centre.lng = parseFloat(url.searchParams.get('lng'));
	}

	return { centre, zoomLvl };
}
